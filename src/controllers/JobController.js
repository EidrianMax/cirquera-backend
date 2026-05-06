import Job from '../models/Job.js'
import Application from '../models/Application.js'
import jwt from 'jsonwebtoken'

const getTalentIdFromRequest = (req) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer')) return null

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key')

    return decoded.type === 'user' ? decoded.id : null
  } catch {
    return null
  }
}

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
    const { location, contractType, skills, search } = req.query

    const query = {
      isActive: true
    }

    // 📍 Location (case insensitive)
    if (location) {
      query.location = { $regex: location, $options: 'i' }
    }

    // 📄 Contract type
    if (contractType) {
      query.contractType = contractType
    }

    // 🧠 Smart search (title + description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // 🚀 Skills como ARRAY real
    if (skills) {
      const skillsArray = Array.isArray(skills)
        ? skills
        : [skills]

      query.skillsRequired = {
        $in: skillsArray.map(s => new RegExp(s, 'i'))
      }
    }

    const jobs = await Job.find(query)
      .populate('company', 'name username logo location')

    const talentId = getTalentIdFromRequest(req)

    if (!talentId) {
      return res.json(jobs)
    }

    const jobIds = jobs.map(job => job._id)
    const applications = await Application.find({
      talent: talentId,
      job: { $in: jobIds }
    }).select('job status message')

    const applicationsByJob = applications.reduce((acc, application) => {
      acc[application.job.toString()] = application
      return acc
    }, {})

    const jobsWithApplicationStatus = jobs.map(job => {
      const jobObject = job.toObject()
      const application = applicationsByJob[job._id.toString()]

      return {
        ...jobObject,
        applicationId: application?._id || null,
        applicationStatus: application?.status || null,
        applicationMessage: application?.message || ''
      }
    })

    return res.json(jobsWithApplicationStatus)
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
 * UPDATE JOB
 */
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (job.company.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    )

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
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      company: req.user.id
    })

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    return res.json({ message: 'Job removed' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
