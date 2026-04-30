import Application from '../models/Application.js'
import Job from '../models/Job.js'
import User from '../models/User.js'

const normalizeSkills = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

const isJobManager = (job, user) => user.role === 'admin' || job.company.toString() === user.id

const buildJobFilters = (queryParams) => {
  const query = { isActive: true }

  if (queryParams.location) {
    query.location = { $regex: String(queryParams.location), $options: 'i' }
  }

  if (queryParams.contractType) {
    query.contractType = queryParams.contractType
  }

  if (queryParams.skill) {
    query.skillsRequired = { $in: [String(queryParams.skill)] }
  }

  return query
}

/**
 * CREATE JOB
 */
export const createJob = async (req, res) => {
  try {
    if (!['company', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only companies or admins can create jobs' })
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''

    if (!title) {
      return res.status(422).json({ message: 'Title is required' })
    }

    let companyId = req.user.id

    if (req.user.role === 'admin') {
      if (!req.body.company) {
        return res.status(422).json({ message: 'Admins must provide a company id to create a job' })
      }

      const company = await User.findById(req.body.company)
      if (!company || company.role !== 'company') {
        return res.status(422).json({ message: 'A valid company account is required' })
      }

      companyId = company.id
    }

    const job = await Job.create({
      title,
      description: typeof req.body.description === 'string' ? req.body.description.trim() : '',
      location: typeof req.body.location === 'string' ? req.body.location.trim() : '',
      contractType: req.body.contractType,
      skillsRequired: normalizeSkills(req.body.skillsRequired),
      company: companyId,
      status: 'active',
      isActive: true
    })

    return res.status(201).json(job)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

/**
 * GET JOBS
 */
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find(buildJobFilters(req.query))
      .populate('company', 'name avatar location bio')
      .sort({ createdAt: -1 })

    let appMap = {}

    if (req.user?.role === 'talent') {
      const applications = await Application.find({ talent: req.user.id }).select('job status')

      appMap = applications.reduce((carry, application) => {
        carry[application.job.toString()] = application.status
        return carry
      }, {})
    }

    const jobsWithStatus = jobs.map(job => ({
      ...job.toObject(),
      applicationStatus: appMap[job._id.toString()] || null
    }))

    return res.json(jobsWithStatus)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

/**
 * GET JOB BY ID
 */
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name avatar location bio')

    if (!job || (!job.isActive && (!req.user || !isJobManager(job, req.user)))) {
      return res.status(404).json({ message: 'Job not found' })
    }

    return res.json(job)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

/**
 * UPDATE JOB
 */
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (!isJobManager(job, req.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (typeof req.body.title === 'string' && req.body.title.trim()) job.title = req.body.title.trim()
    if (typeof req.body.description === 'string') job.description = req.body.description.trim()
    if (typeof req.body.location === 'string') job.location = req.body.location.trim()
    if (typeof req.body.contractType === 'string') job.contractType = req.body.contractType
    if (Array.isArray(req.body.skillsRequired)) job.skillsRequired = normalizeSkills(req.body.skillsRequired)

    if (req.body.isActive !== undefined) {
      job.isActive = Boolean(req.body.isActive)
    }

    if (req.user.role === 'admin' && typeof req.body.status === 'string') {
      job.status = req.body.status
      if (['rejected', 'closed', 'deleted'].includes(job.status)) {
        job.isActive = false
      }
    }

    if (req.user.role === 'admin' && req.body.company) {
      const company = await User.findById(req.body.company)
      if (!company || company.role !== 'company') {
        return res.status(422).json({ message: 'A valid company account is required' })
      }

      job.company = company.id
    }

    if (job.isActive && job.status !== 'active') {
      job.status = 'active'
    }

    const updatedJob = await job.save()

    return res.json(updatedJob)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

/**
 * DELETE JOB
 */
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (!isJobManager(job, req.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    job.isActive = false
    job.status = 'deleted'
    await job.save()

    return res.json({ message: 'Job removed' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
