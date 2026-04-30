import Application from '../models/Application.js'
import Job from '../models/Job.js'
import { createNotification } from './NotificationController.js'

const getCompanyJobIds = async (companyId) => {
  const jobs = await Job.find({ company: companyId }).select('_id')
  return jobs.map(job => job._id)
}

// @desc    Apply for a job
// @route   POST /api/applications
export const applyToJob = async (req, res) => {
  try {
    if (req.user.role !== 'talent') {
      return res.status(403).json({ message: 'Only talent accounts can apply to jobs' })
    }

    const { job, message } = req.body

    if (!job) {
      return res.status(422).json({ message: 'Job id is required' })
    }

    const targetJob = await Job.findById(job)
    if (!targetJob || !targetJob.isActive) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (targetJob.company.toString() === req.user.id) {
      return res.status(422).json({ message: 'You cannot apply to your own job' })
    }

    const application = await Application.create({
      job,
      talent: req.user.id,
      message: typeof message === 'string' ? message.trim() : ''
    })

    await createNotification({
      user: targetJob.company,
      type: 'newApplication',
      fromUser: req.user.id,
      relatedJob: job
    })

    return res.status(201).json(application)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this job' })
    }

    return res.status(500).json({ message: error.message })
  }
}

// @desc    Get all applications visible to the current user
// @route   GET /api/applications
export const getApplications = async (req, res) => {
  try {
    const query = {}

    if (req.user.role === 'admin') {
      if (req.query.job) query.job = req.query.job
      if (req.query.talent) query.talent = req.query.talent
      if (req.query.status) query.status = req.query.status
    } else if (req.user.role === 'company') {
      const jobIds = await getCompanyJobIds(req.user.id)

      if (req.query.job) {
        const ownsRequestedJob = jobIds.some(jobId => jobId.toString() === String(req.query.job))
        if (!ownsRequestedJob) {
          return res.status(403).json({ message: 'Not authorized' })
        }

        query.job = req.query.job
      } else {
        query.job = { $in: jobIds }
      }

      if (req.query.status) query.status = req.query.status
    } else {
      query.talent = req.user.id
      if (req.query.status) query.status = req.query.status
    }

    const applications = await Application.find(query)
      .populate({
        path: 'job',
        select: 'title company status isActive',
        populate: { path: 'company', select: 'name avatar role' }
      })
      .populate('talent', 'name avatar skills role')
      .sort({ createdAt: -1 })

    return res.json(applications)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Update application status
// @route   PUT /api/applications/:id
export const updateApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('job')

    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }

    const canManage = req.user.role === 'admin' || application.job.company.toString() === req.user.id
    if (!canManage) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (!['accepted', 'rejected', 'pending'].includes(req.body.status)) {
      return res.status(422).json({ message: 'Invalid application status' })
    }

    application.status = req.body.status
    const updatedApplication = await application.save()

    if (application.status === 'accepted') {
      await createNotification({
        user: application.talent,
        type: 'jobAccepted',
        relatedJob: application.job._id
      })
    }

    return res.json(updatedApplication)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Delete application
// @route   DELETE /api/applications/:id
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('job')

    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }

    const canDelete = req.user.role === 'admin' ||
      application.talent.toString() === req.user.id ||
      application.job.company.toString() === req.user.id

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await application.deleteOne()
    return res.json({ message: 'Application removed' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
