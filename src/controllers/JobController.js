import Job from '../models/Job.js'
import Application from '../models/Application.js'

export const createJob = async (req, res) => {
  try {
    const { title, description, location, contractType, skillsRequired, company } = req.body

    const job = await Job.create({
      title,
      description,
      location,
      contractType,
      skillsRequired,
      company
    })

    res.status(201).json(job)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getJobs = async (req, res) => {
  try {
    const { location, contractType, skill } = req.query
    const query = { isActive: true }

    if (location) query.location = { $regex: location, $options: 'i' }
    if (contractType) query.contractType = contractType
    if (skill) query.skillsRequired = { $in: [skill] }

    const jobs = await Job.find(query).populate('company', 'name avatar')

    const applications = await Application.find({ talent: req.user.id })

    const appMap = {}
    applications.forEach(app => {
      appMap[app.job.toString()] = app.status
    })

    const jobsWithStatus = jobs.map(job => {
      const jobObj = job.toObject()
      jobObj.applicationStatus = appMap[job._id] || null
      return jobObj
    })

    res.json(jobsWithStatus)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company', 'name avatar location bio')
    if (job) {
      res.json(job)
    } else {
      res.status(404).json({ message: 'Job not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (job) {
      job.title = req.body.title || job.title
      job.description = req.body.description || job.description
      job.location = req.body.location || job.location
      job.contractType = req.body.contractType || job.contractType
      job.skillsRequired = req.body.skillsRequired || job.skillsRequired
      job.isActive = req.body.isActive !== undefined ? req.body.isActive : job.isActive

      const updatedJob = await job.save()
      res.json(updatedJob)
    } else {
      res.status(404).json({ message: 'Job not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
    if (job) {
      await job.deleteOne()
      res.json({ message: 'Job removed' })
    } else {
      res.status(404).json({ message: 'Job not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
