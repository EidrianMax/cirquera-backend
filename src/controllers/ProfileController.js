import Company from '../models/Company.js'
import User from '../models/User.js'
import { buildProfile } from './utils.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const normalizeSegment = (value) => {
  if (!value) return ''

  try {
    return decodeURIComponent(value).trim()
  } catch {
    return String(value).trim()
  }
}

const slugify = (value) =>
  normalizeSegment(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const findByUsername = async (Model, rawUsername) => {
  const username = normalizeSegment(rawUsername)
  const slug = slugify(username)
  const candidates = [...new Set([username, slug].filter(Boolean))]

  for (const candidate of candidates) {
    const exactMatch = await Model.findOne({ username: candidate }).select('-password')
    if (exactMatch) return exactMatch
  }

  if (!username) return null

  return Model.findOne({
    username: new RegExp(`^${escapeRegex(username)}$`, 'i')
  }).select('-password')
}

const findCompanyByNameSlug = async (rawUsername) => {
  const slug = slugify(rawUsername)
  if (!slug) return null

  const companies = await Company.find({}).select('-password')
  return companies.find((company) => slugify(company.name) === slug) || null
}

// @desc    Get public profile by username
// @route   GET /api/profiles/:username
export const getProfileByUsername = async (req, res) => {
  try {
    const username = normalizeSegment(req.params.username)
    const myId = req.user.id

    const user = await findByUsername(User, username)
    if (user) {
      const profile = await buildProfile(myId, user._id, 'User')
      return res.json({
        type: 'user',
        user,
        ...profile
      })
    }

    const company =
      (await findByUsername(Company, username)) ||
      (await findCompanyByNameSlug(username))

    if (company) {
      const profile = await buildProfile(myId, company._id, 'Company')
      return res.json({
        type: 'company',
        company,
        ...profile
      })
    }

    return res.status(404).json({ message: 'Profile not found' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
