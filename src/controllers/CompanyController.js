import Company from '../models/Company.js'
import { buildProfile, generateCompanyUsername } from './utils.js'

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()

    res.json(companies)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const registerCompany = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const exists = await Company.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'Company already exists' })
    }

    const username = await generateCompanyUsername(name)

    const company = await Company.create({
      name,
      username,
      email,
      password
    })

    res.status(201).json(company)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id)

    if (!company) {
      return res.status(404).json({ message: 'Company not found' })
    }

    res.json(company)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get company profile
// @route   GET /api/companies/:username
export const getCompanyByUsername = async (req, res) => {
  console.log('entras')
  try {
    const { username } = req.params
    const myId = req.user.id

    const company = await Company.findOne({ username })

    if (!company) {
      return res.status(404).json({ message: 'Company not found' })
    }

    const profile = await buildProfile(myId, company._id, 'Company')

    res.json({
      company,
      ...profile
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
    console.log(error)
  }
}

export const updateMyCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id)

    if (!company) {
      return res.status(404).json({ message: 'Company not found' })
    }

    Object.assign(company, req.body)

    const updated = await company.save()

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
