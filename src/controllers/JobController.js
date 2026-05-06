import Job from '../models/Job.js'

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

    return res.json(jobs)
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
