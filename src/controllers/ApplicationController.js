import Application from '../models/Application.js'
import { createNotification } from './NotificationController.js'

// @desc    Apply for a job
// @route   POST /api/applications
export const applyToJob = async (req, res) => {
  try {
    if (req.authType !== 'user') {
      return res.status(403).json({ message: 'Only talents can apply to jobs' })
    }

    const { job, message } = req.body
    const talent = req.user.id

    const existingApplication = await Application.findOne({ job, talent })

    if (existingApplication) {
      existingApplication.message = message ?? existingApplication.message
      const updatedApplication = await existingApplication.save()
      return res.json(updatedApplication)
    }

    const application = await Application.create({
      job,
      talent,
      message
    })

    // Notificar a la empresa del trabajo
    const Job = await (await import('../models/Job.js')).default
    const targetJob = await Job.findById(job)

    await createNotification({
      user: targetJob.company,
      type: 'newApplication',
      fromUser: talent,
      relatedJob: job
    })

    res.status(201).json(application)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all applications (with filters)
// @route   GET /api/applications
export const getApplications = async (req, res) => {
  try {
    const { job, talent } = req.query
    const query = {}

    if (job) query.job = job
    if (talent) query.talent = talent

    const applications = await Application.find(query)
      .populate('job', 'title')
      .populate('talent', 'firstName lastName username avatar skills jobTitle')
    res.json(applications)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update application status
// @route   PUT /api/applications/:id
export const updateApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)

    if (application) {
      const previousStatus = application.status
      application.status = req.body.status || application.status
      if (req.body.message !== undefined) {
        application.message = req.body.message
      }
      const updatedApplication = await application.save()

      if (req.body.status === 'accepted' && previousStatus !== 'accepted') {
        await createNotification({
          user: application.talent,
          type: 'jobAccepted',
          relatedJob: application.job
        })
      }

      res.json(updatedApplication)
    } else {
      res.status(404).json({ message: 'Application not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Delete application
// @route   DELETE /api/applications/:id
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
    if (application) {
      await application.deleteOne()
      res.json({ message: 'Application removed' })
    } else {
      res.status(404).json({ message: 'Application not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
