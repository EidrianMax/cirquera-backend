import Job from '../models/Job.js'
import Application from '../models/Application.js'

/**
 * CREATE JOB (solo company/admin)
 */
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      contractType,
      skillsRequired
    } = req.body

    const job = await Job.create({
      title,
      description,
      location,
      contractType,
      skillsRequired,

      // 🔥 IMPORTANTE: la empresa NO viene del frontend
      company: req.user.id
    })

    res.status(201).json(job)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET JOBS (con filtros + estado de aplicación)
 */
export const getJobs = async (req, res) => {
  try {
    const { location, contractType, skill } = req.query

    const query = { isActive: true }

    if (location) {
      query.location = { $regex: location, $options: 'i' }
    }

    if (contractType) {
      query.contractType = contractType
    }

    if (skill) {
      query.skillsRequired = { $in: [skill] }
    }

    const jobs = await Job.find(query)
      .populate('company', 'name avatar')

    // 🔥 SOLO lo necesario
    const applications = await Application.find({
      talent: req.user.id
    }).select('job status')

    const appMap = {}

    applications.forEach(app => {
      appMap[app.job.toString()] = app.status
    })

    const jobsWithStatus = jobs.map(job => {
      const jobObj = job.toObject()

      return {
        ...jobObj,
        applicationStatus: appMap[job._id.toString()] || null
      }
    })

    res.json(jobsWithStatus)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET JOB BY ID
 */
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name avatar location bio')

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    res.json(job)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * UPDATE JOB (solo owner)
 */
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    // 🔥 Seguridad: solo el owner puede editar
    if (job.company.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    job.title = req.body.title || job.title
    job.description = req.body.description || job.description
    job.location = req.body.location || job.location
    job.contractType = req.body.contractType || job.contractType
    job.skillsRequired = req.body.skillsRequired || job.skillsRequired
    job.isActive =
      req.body.isActive !== undefined
        ? req.body.isActive
        : job.isActive

    const updatedJob = await job.save()

    res.json(updatedJob)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * DELETE JOB (solo owner)
 */
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    // 🔥 Seguridad: solo el owner
    if (job.company.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await job.deleteOne()

    res.json({ message: 'Job removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}