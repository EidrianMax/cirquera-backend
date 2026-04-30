import Application from '../models/Application.js'
import Job from '../models/Job.js'
import Post from '../models/Post.js'
import User from '../models/User.js'

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

export const getAdminSummary = async (req, res) => {
  try {
    const [users, activeJobs, applications, posts, pendingApplications] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Application.countDocuments(),
      Post.countDocuments(),
      Application.countDocuments({ status: 'pending' })
    ])

    return res.json({
      users,
      activeJobs,
      applications,
      posts,
      pendingApplications
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const adminListUsers = async (req, res) => {
  try {
    const query = {}

    if (req.query.role) query.role = req.query.role
    if (req.query.status) query.status = req.query.status
    if (req.query.search) {
      query.$or = [
        { name: { $regex: String(req.query.search), $options: 'i' } },
        { email: { $regex: String(req.query.search), $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .select('name email role status avatar location bio createdAt updatedAt')
      .sort({ createdAt: -1 })

    return res.json(users)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const adminUpdateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (typeof req.body.name === 'string' && req.body.name.trim()) user.name = req.body.name.trim()
    if (typeof req.body.email === 'string' && req.body.email.trim()) user.email = normalizeEmail(req.body.email)
    if (typeof req.body.location === 'string') user.location = req.body.location.trim()
    if (typeof req.body.bio === 'string') user.bio = req.body.bio.trim()

    if (req.body.role !== undefined) {
      if (!['talent', 'company', 'admin'].includes(req.body.role)) {
        return res.status(422).json({ message: 'Invalid role' })
      }

      if (user.id === req.user.id && req.body.role !== 'admin') {
        return res.status(422).json({ message: 'You cannot remove your own admin role' })
      }

      user.role = req.body.role
    }

    if (req.body.status !== undefined) {
      if (!['active', 'suspended'].includes(req.body.status)) {
        return res.status(422).json({ message: 'Invalid status' })
      }

      if (user.id === req.user.id && req.body.status !== 'active') {
        return res.status(422).json({ message: 'You cannot suspend your own account' })
      }

      user.status = req.body.status
    }

    if (req.body.password !== undefined) {
      if (typeof req.body.password !== 'string' || req.body.password.length < 6) {
        return res.status(422).json({ message: 'Password must be at least 6 characters long' })
      }

      user.password = req.body.password
    }

    const updatedUser = await user.save()
    return res.json(updatedUser)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    return res.status(500).json({ message: error.message })
  }
}

export const adminListJobs = async (req, res) => {
  try {
    const query = {}

    if (req.query.status) query.status = req.query.status
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true'
    if (req.query.company) query.company = req.query.company
    if (req.query.search) {
      query.title = { $regex: String(req.query.search), $options: 'i' }
    }

    const jobs = await Job.find(query)
      .populate('company', 'name email role status avatar')
      .sort({ createdAt: -1 })

    return res.json(jobs)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const adminUpdateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (typeof req.body.title === 'string' && req.body.title.trim()) job.title = req.body.title.trim()
    if (typeof req.body.description === 'string') job.description = req.body.description.trim()
    if (typeof req.body.location === 'string') job.location = req.body.location.trim()
    if (typeof req.body.contractType === 'string') job.contractType = req.body.contractType
    if (Array.isArray(req.body.skillsRequired)) job.skillsRequired = req.body.skillsRequired

    if (req.body.status !== undefined) {
      if (!['active', 'rejected', 'closed', 'deleted'].includes(req.body.status)) {
        return res.status(422).json({ message: 'Invalid job status' })
      }

      job.status = req.body.status
      job.isActive = req.body.status === 'active'
    }

    if (req.body.isActive !== undefined) {
      job.isActive = Boolean(req.body.isActive)
      if (job.isActive && job.status !== 'active') {
        job.status = 'active'
      }
    }

    if (req.body.company !== undefined) {
      const company = await User.findById(req.body.company)
      if (!company || company.role !== 'company') {
        return res.status(422).json({ message: 'A valid company account is required' })
      }

      job.company = company.id
    }

    const updatedJob = await job.save()
    return res.json(updatedJob)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const adminListApplications = async (req, res) => {
  try {
    const query = {}

    if (req.query.status) query.status = req.query.status
    if (req.query.job) query.job = req.query.job
    if (req.query.talent) query.talent = req.query.talent

    const applications = await Application.find(query)
      .populate({
        path: 'job',
        select: 'title company status isActive',
        populate: { path: 'company', select: 'name email' }
      })
      .populate('talent', 'name email avatar role status')
      .sort({ createdAt: -1 })

    return res.json(applications)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
