import mongoose from 'mongoose'
import Application from '../models/Application.js'
import Category from '../models/Category.js'
import Company from '../models/Company.js'
import Job from '../models/Job.js'
import Post from '../models/Post.js'
import Report from '../models/Report.js'
import User from '../models/User.js'
import { generateCompanyUsername, generateToken, generateUsername } from './utils.js'

const ACCOUNT_ROLES = ['talent', 'company', 'admin']
const ACCOUNT_STATUSES = ['active', 'suspended']
const JOB_STATUSES = ['pending', 'approved', 'rejected']
const REPORT_STATUSES = ['pending', 'investigating', 'resolved', 'dismissed']

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const hasValue = value => value !== undefined && value !== null && String(value).trim() !== ''

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100)

  return { page, limit }
}

const paginateArray = (items, page, limit) => {
  const total = items.length
  const lastPage = Math.max(Math.ceil(total / limit), 1)
  const start = (page - 1) * limit

  return {
    data: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      lastPage,
      hasNextPage: page < lastPage,
      hasPrevPage: page > 1
    }
  }
}

const parseList = value => {
  if (!value) return []
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean)

  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

const splitName = value => {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)

  return {
    firstName: parts.shift() || 'Usuario',
    lastName: parts.join(' ') || 'Cirquera'
  }
}

const getUserDisplayName = user => {
  const raw = user.toObject ? user.toObject() : user
  return raw.name || [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim() || raw.username || raw.email
}

const normalizeDate = value => value ? new Date(value).toISOString() : null

const normalizeAccount = (account, accountType) => {
  const raw = account.toObject ? account.toObject({ virtuals: true }) : account
  const id = raw._id?.toString() || raw.id?.toString()
  const isCompany = accountType === 'company'
  const name = isCompany ? raw.name : getUserDisplayName(raw)

  return {
    _id: id,
    id,
    type: isCompany ? 'company' : 'user',
    role: isCompany ? 'company' : raw.role,
    name,
    firstName: raw.firstName,
    lastName: raw.lastName,
    username: raw.username,
    email: raw.email,
    status: raw.status || 'active',
    avatar: isCompany ? raw.logo : raw.avatar,
    logo: raw.logo,
    location: raw.location,
    bio: isCompany ? raw.description : raw.bio,
    description: raw.description,
    industry: raw.industry,
    website: raw.website,
    socialLinks: raw.socialLinks,
    skills: raw.skills || [],
    experience: raw.experience || [],
    portfolio: raw.portfolio || [],
    createdAt: normalizeDate(raw.createdAt || raw.created_at),
    updatedAt: normalizeDate(raw.updatedAt || raw.updated_at)
  }
}

const normalizeJob = job => {
  const raw = job.toObject ? job.toObject() : job
  const id = raw._id?.toString() || raw.id?.toString()
  const companyIsObject = raw.company && typeof raw.company === 'object' && raw.company._id
  const company = companyIsObject ? raw.company : null
  const status = raw.status || (raw.isActive ? 'approved' : 'pending')

  return {
    _id: id,
    id,
    title: raw.title,
    description: raw.description,
    location: raw.location,
    contractType: raw.contractType,
    skillsRequired: raw.skillsRequired || [],
    company: company ? company._id.toString() : raw.company?.toString(),
    companyData: company ? normalizeAccount(company, 'company') : undefined,
    companyName: company ? company.name : undefined,
    status,
    isActive: raw.isActive === undefined ? status === 'approved' : raw.isActive,
    createdAt: normalizeDate(raw.createdAt || raw.created_at),
    updatedAt: normalizeDate(raw.updatedAt || raw.updated_at)
  }
}

const normalizeCategory = category => {
  const raw = category.toObject ? category.toObject() : category
  const id = raw._id?.toString() || raw.id?.toString()

  return {
    _id: id,
    id,
    name: raw.name,
    description: raw.description,
    icon: raw.icon || 'category',
    skills: raw.skills || [],
    createdAt: normalizeDate(raw.createdAt || raw.created_at),
    updatedAt: normalizeDate(raw.updatedAt || raw.updated_at)
  }
}

const normalizeReport = report => {
  const raw = report.toObject ? report.toObject() : report
  const id = raw._id?.toString() || raw.id?.toString()

  return {
    _id: id,
    id,
    targetType: raw.targetType,
    targetId: raw.targetId?.toString(),
    targetName: raw.targetName,
    reportedBy: raw.reportedBy?.toString(),
    reason: raw.reason,
    evidence: raw.evidence || [],
    status: raw.status || 'pending',
    resolution: raw.resolution,
    actionTaken: raw.actionTaken,
    createdAt: normalizeDate(raw.createdAt || raw.created_at),
    updatedAt: normalizeDate(raw.updatedAt || raw.updated_at)
  }
}

const isValidObjectId = id => mongoose.Types.ObjectId.isValid(id)

const findAccountById = async id => {
  if (!isValidObjectId(id)) return null

  const user = await User.findById(id)
  if (user) return { account: user, type: 'user' }

  const company = await Company.findById(id)
  if (company) return { account: company, type: 'company' }

  return null
}

const emailExists = async (email, currentId = null) => {
  const [user, company] = await Promise.all([
    User.findOne({ email }),
    Company.findOne({ email })
  ])

  const matchesCurrent = item => item && currentId && item._id.toString() === currentId.toString()

  return (!!user && !matchesCurrent(user)) || (!!company && !matchesCurrent(company))
}

const buildAdminAccountQuery = ({ role, status, search, company = false }) => {
  const query = {}
  const and = []

  if (!company && (role === 'talent' || role === 'admin')) query.role = role

  if (status === 'active') {
    and.push({
      $or: [
        { status: 'active' },
        { status: { $exists: false } },
        { status: null }
      ]
    })
  }

  if (status === 'suspended') {
    query.status = 'suspended'
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i')
    and.push({
      $or: company
        ? [
            { name: pattern },
            { username: pattern },
            { email: pattern },
            { location: pattern },
            { industry: pattern },
            { description: pattern }
          ]
        : [
            { name: pattern },
            { firstName: pattern },
            { lastName: pattern },
            { username: pattern },
            { email: pattern },
            { location: pattern }
          ]
    })
  }

  if (and.length) query.$and = and

  return query
}

const getAccountCollections = async ({ role, status, search, sort = true }) => {
  const userQuery = buildAdminAccountQuery({ role, status, search })
  const companyQuery = buildAdminAccountQuery({ role, status, search, company: true })
  const includeUsers = role !== 'company'
  const includeCompanies = !role || role === 'company'

  const [users, companies] = await Promise.all([
    includeUsers ? User.find(userQuery).sort(sort ? { createdAt: -1 } : {}) : [],
    includeCompanies ? Company.find(companyQuery).sort(sort ? { createdAt: -1 } : {}) : []
  ])

  return [
    ...users.map(user => normalizeAccount(user, 'user')),
    ...companies.map(company => normalizeAccount(company, 'company'))
  ].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
}

const findTarget = async (targetType, targetId) => {
  if (!isValidObjectId(targetId)) return null

  if (targetType === 'user') {
    const user = await User.findById(targetId)
    if (user) return { item: user, type: 'user', name: getUserDisplayName(user) }

    const company = await Company.findById(targetId)
    if (company) return { item: company, type: 'company', name: company.name }
  }

  if (targetType === 'company') {
    const company = await Company.findById(targetId)
    if (company) return { item: company, type: 'company', name: company.name }
  }

  if (targetType === 'job') {
    const job = await Job.findById(targetId)
    if (job) return { item: job, type: 'job', name: job.title }
  }

  if (targetType === 'post') {
    const post = await Post.findById(targetId)
    if (post) return { item: post, type: 'post', name: `Publicación ${post._id}` }
  }

  return null
}

const sendValidationError = (res, message) => res.status(400).json({ message })

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!hasValue(email) || !hasValue(password)) {
      return sendValidationError(res, 'Email and password are required')
    }

    const adminUser = await User.findOne({ email, role: 'admin' })

    if (!adminUser) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isValid = await adminUser.matchPassword(password)

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    res.json({
      ...normalizeAccount(adminUser, 'user'),
      type: 'user',
      token: generateToken(adminUser._id, 'user')
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAdminDashboard = async (req, res) => {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [
      talents,
      admins,
      companies,
      suspendedUsers,
      suspendedCompanies,
      monthlyUsers,
      monthlyCompanies,
      jobs,
      approvedJobs,
      pendingJobs,
      rejectedJobs,
      posts,
      applications,
      pendingApplications,
      reports,
      pendingReports,
      categories
    ] = await Promise.all([
      User.countDocuments({ role: 'talent' }),
      User.countDocuments({ role: 'admin' }),
      Company.countDocuments(),
      User.countDocuments({ status: 'suspended' }),
      Company.countDocuments({ status: 'suspended' }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Company.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Job.countDocuments(),
      Job.countDocuments({ $or: [{ status: 'approved' }, { status: { $exists: false }, isActive: true }] }),
      Job.countDocuments({ status: 'pending' }),
      Job.countDocuments({ status: 'rejected' }),
      Post.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      Report.countDocuments({ status: { $in: ['pending', 'investigating'] } }),
      Category.find()
    ])

    const [recentUsers, recentCompanies, recentJobs, recentReports] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5),
      Company.find().sort({ createdAt: -1 }).limit(5),
      Job.find().populate('company', 'name username logo location status').sort({ createdAt: -1 }).limit(5),
      Report.find().sort({ createdAt: -1 }).limit(5)
    ])

    const recentAccounts = [
      ...recentUsers.map(user => normalizeAccount(user, 'user')),
      ...recentCompanies.map(company => normalizeAccount(company, 'company'))
    ].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)).slice(0, 5)

    res.json({
      metrics: {
        totalAccounts: talents + admins + companies,
        totalUsers: talents + admins,
        totalTalents: talents,
        totalAdmins: admins,
        totalCompanies: companies,
        activeAccounts: talents + admins + companies - suspendedUsers - suspendedCompanies,
        suspendedAccounts: suspendedUsers + suspendedCompanies,
        monthlyAccounts: monthlyUsers + monthlyCompanies,
        totalJobs: jobs,
        approvedJobs,
        activeJobs: approvedJobs,
        pendingJobs,
        rejectedJobs,
        totalPosts: posts,
        totalApplications: applications,
        pendingApplications,
        totalReports: reports,
        pendingReports,
        totalCategories: categories.length,
        totalSkills: [...new Set(categories.flatMap(category => category.skills || []))].length
      },
      recent: {
        accounts: recentAccounts,
        jobs: recentJobs.map(normalizeJob),
        reports: recentReports.map(normalizeReport)
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAdminAccounts = async (req, res) => {
  try {
    const { role, status, q } = req.query

    if (role && !ACCOUNT_ROLES.includes(role)) {
      return sendValidationError(res, 'Invalid role')
    }

    if (status && !ACCOUNT_STATUSES.includes(status)) {
      return sendValidationError(res, 'Invalid status')
    }

    const { page, limit } = parsePagination(req.query)
    const accounts = await getAccountCollections({ role, status, search: q || req.query.search })
    const paginated = paginateArray(accounts, page, limit)

    const [totalUsers, totalCompanies, monthlyUsers, monthlyCompanies] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
      Company.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } })
    ])

    res.json({
      ...paginated,
      totals: {
        totalUsers: totalUsers + totalCompanies,
        userAccounts: totalUsers,
        companyAccounts: totalCompanies,
        monthlyUsers: monthlyUsers + monthlyCompanies
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAdminAccountById = async (req, res) => {
  try {
    const result = await findAccountById(req.params.id)

    if (!result) {
      return res.status(404).json({ message: 'Account not found' })
    }

    res.json(normalizeAccount(result.account, result.type))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createAdminAccount = async (req, res) => {
  try {
    const role = req.body.role || 'talent'

    if (!ACCOUNT_ROLES.includes(role)) {
      return sendValidationError(res, 'Invalid role')
    }

    if (!hasValue(req.body.email) || !hasValue(req.body.password)) {
      return sendValidationError(res, 'Email and password are required')
    }

    if (await emailExists(req.body.email)) {
      return sendValidationError(res, 'Email already exists')
    }

    const status = ACCOUNT_STATUSES.includes(req.body.status) ? req.body.status : 'active'

    if (role === 'company') {
      if (!hasValue(req.body.name)) {
        return sendValidationError(res, 'Name is required')
      }

      const company = await Company.create({
        name: req.body.name,
        username: req.body.username || await generateCompanyUsername(req.body.name),
        email: req.body.email,
        password: req.body.password,
        status,
        logo: req.body.logo || req.body.avatar,
        location: req.body.location,
        description: req.body.description || req.body.bio,
        industry: req.body.industry,
        website: req.body.website,
        socialLinks: req.body.socialLinks
      })

      return res.status(201).json(normalizeAccount(company, 'company'))
    }

    const fullName = req.body.name || `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim()
    const names = splitName(fullName)
    const firstName = req.body.firstName || names.firstName
    const lastName = req.body.lastName || names.lastName

    const user = await User.create({
      role,
      firstName,
      lastName,
      name: fullName || `${firstName} ${lastName}`,
      username: req.body.username || await generateUsername(firstName, lastName),
      email: req.body.email,
      password: req.body.password,
      status,
      avatar: req.body.avatar,
      location: req.body.location,
      bio: req.body.bio,
      skills: req.body.skills || [],
      experience: req.body.experience || [],
      portfolio: req.body.portfolio || []
    })

    res.status(201).json(normalizeAccount(user, 'user'))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateAdminAccount = async (req, res) => {
  try {
    const result = await findAccountById(req.params.id)

    if (!result) {
      return res.status(404).json({ message: 'Account not found' })
    }

    if (req.body.email && await emailExists(req.body.email, req.params.id)) {
      return sendValidationError(res, 'Email already exists')
    }

    if (req.body.status && !ACCOUNT_STATUSES.includes(req.body.status)) {
      return sendValidationError(res, 'Invalid status')
    }

    if (result.type === 'company') {
      if (req.body.role && req.body.role !== 'company') {
        return sendValidationError(res, 'Changing an account between user and company is not supported')
      }

      const company = result.account
      const allowed = ['name', 'username', 'email', 'password', 'status', 'logo', 'location', 'description', 'industry', 'website', 'socialLinks']
      allowed.forEach(field => {
        if (req.body[field] !== undefined) company[field] = req.body[field]
      })

      if (req.body.avatar !== undefined) company.logo = req.body.avatar
      if (req.body.bio !== undefined) company.description = req.body.bio

      const updated = await company.save()
      return res.json(normalizeAccount(updated, 'company'))
    }

    if (req.body.role && !['talent', 'admin'].includes(req.body.role)) {
      return sendValidationError(res, 'Changing an account between user and company is not supported')
    }

    const user = result.account
    const allowed = ['role', 'firstName', 'lastName', 'name', 'username', 'email', 'password', 'status', 'avatar', 'location', 'bio', 'skills', 'experience', 'portfolio']
    allowed.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field]
    })

    if (req.body.name && (!req.body.firstName || !req.body.lastName)) {
      const names = splitName(req.body.name)
      user.firstName = req.body.firstName || names.firstName
      user.lastName = req.body.lastName || names.lastName
    }

    const updated = await user.save()
    res.json(normalizeAccount(updated, 'user'))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateAdminAccountStatus = async (req, res) => {
  try {
    const result = await findAccountById(req.params.id)

    if (!result) {
      return res.status(404).json({ message: 'Account not found' })
    }

    const current = result.account.status || 'active'
    const nextStatus = req.body.status || (current === 'suspended' ? 'active' : 'suspended')

    if (!ACCOUNT_STATUSES.includes(nextStatus)) {
      return sendValidationError(res, 'Invalid status')
    }

    result.account.status = nextStatus
    const updated = await result.account.save()

    res.json(normalizeAccount(updated, result.type))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteAdminAccount = async (req, res) => {
  try {
    const result = await findAccountById(req.params.id)

    if (!result) {
      return res.status(404).json({ message: 'Account not found' })
    }

    if (result.type === 'user' && req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' })
    }

    await result.account.deleteOne()

    res.json({ message: 'Account removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const exportAdminAccounts = async (req, res) => {
  try {
    const accounts = await getAccountCollections({
      role: req.query.role,
      status: req.query.status,
      search: req.query.q || req.query.search
    })

    const rows = [
      ['id', 'nombre', 'email', 'rol', 'estado', 'ubicacion', 'registro'],
      ...accounts.map(account => [
        account._id,
        account.name || '',
        account.email || '',
        account.role || '',
        account.status || 'active',
        account.location || '',
        account.createdAt || ''
      ])
    ]

    const csv = rows
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="cirquera-usuarios-${new Date().toISOString().slice(0, 10)}.csv"`)
    res.send(csv)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAdminJobs = async (req, res) => {
  try {
    const { status, q, search } = req.query

    if (status && !JOB_STATUSES.includes(status)) {
      return sendValidationError(res, 'Invalid status')
    }

    const query = {}
    const and = []

    if (status === 'approved') {
      and.push({
        $or: [
          { status: 'approved' },
          { status: { $exists: false }, isActive: true }
        ]
      })
    } else if (status) {
      query.status = status
    }

    const searchValue = q || search
    if (searchValue) {
      const pattern = new RegExp(escapeRegex(searchValue), 'i')
      and.push({
        $or: [
          { title: pattern },
          { description: pattern },
          { location: pattern },
          { contractType: pattern },
          { skillsRequired: pattern }
        ]
      })
    }

    if (and.length) query.$and = and

    const { page, limit } = parsePagination(req.query)
    const total = await Job.countDocuments(query)
    const jobs = await Job.find(query)
      .populate('company', 'name username logo location status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const pendingCount = await Job.countDocuments({ status: 'pending' })

    res.json({
      data: jobs.map(normalizeJob),
      pagination: {
        page,
        limit,
        total,
        lastPage: Math.max(Math.ceil(total / limit), 1),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      totals: {
        pendingCount
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAdminJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company', 'name username logo location status')

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    res.json(normalizeJob(job))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createAdminJob = async (req, res) => {
  try {
    const { title, company } = req.body

    if (!hasValue(title) || !hasValue(company)) {
      return sendValidationError(res, 'Title and company are required')
    }

    if (!isValidObjectId(company) || !(await Company.findById(company))) {
      return sendValidationError(res, 'Company not found')
    }

    const status = JOB_STATUSES.includes(req.body.status) ? req.body.status : 'pending'

    const job = await Job.create({
      title,
      description: req.body.description,
      location: req.body.location,
      contractType: req.body.contractType,
      skillsRequired: parseList(req.body.skillsRequired),
      company,
      status,
      isActive: status === 'approved'
    })

    const populated = await Job.findById(job._id).populate('company', 'name username logo location status')
    res.status(201).json(normalizeJob(populated))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateAdminJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (req.body.status && !JOB_STATUSES.includes(req.body.status)) {
      return sendValidationError(res, 'Invalid status')
    }

    if (req.body.company && (!isValidObjectId(req.body.company) || !(await Company.findById(req.body.company)))) {
      return sendValidationError(res, 'Company not found')
    }

    const allowed = ['title', 'description', 'location', 'contractType', 'company', 'status', 'isActive']
    allowed.forEach(field => {
      if (req.body[field] !== undefined) job[field] = req.body[field]
    })

    if (req.body.skillsRequired !== undefined) {
      job.skillsRequired = parseList(req.body.skillsRequired)
    }

    if (req.body.status) {
      job.isActive = req.body.status === 'approved'
    }

    const updated = await job.save()
    const populated = await Job.findById(updated._id).populate('company', 'name username logo location status')

    res.json(normalizeJob(populated))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateAdminJobStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!JOB_STATUSES.includes(status)) {
      return sendValidationError(res, 'Invalid status')
    }

    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    job.status = status
    job.isActive = status === 'approved'
    const updated = await job.save()
    const populated = await Job.findById(updated._id).populate('company', 'name username logo location status')

    res.json(normalizeJob(populated))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteAdminJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    await job.deleteOne()

    res.json({ message: 'Job removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAdminReports = async (req, res) => {
  try {
    const status = req.query.status || 'pending'

    if (status && !REPORT_STATUSES.includes(status)) {
      return sendValidationError(res, 'Invalid status')
    }

    const query = status === 'pending'
      ? { status: { $in: ['pending', 'investigating'] } }
      : { status }

    const { page, limit } = parsePagination(req.query)
    const total = await Report.countDocuments(query)
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.json({
      data: reports.map(normalizeReport),
      pagination: {
        page,
        limit,
        total,
        lastPage: Math.max(Math.ceil(total / limit), 1),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createAdminReport = async (req, res) => {
  try {
    let { targetType, targetId } = req.body

    if (req.body.target) {
      const parts = String(req.body.target).split(':')
      targetType = targetType || parts[0]
      targetId = targetId || parts[1]
    }

    if (!['user', 'company', 'job', 'post'].includes(targetType) || !hasValue(targetId)) {
      return sendValidationError(res, 'Invalid target')
    }

    if (!hasValue(req.body.reason)) {
      return sendValidationError(res, 'Reason is required')
    }

    const target = await findTarget(targetType, targetId)

    if (!target) {
      return res.status(404).json({ message: 'Target not found' })
    }

    const report = await Report.create({
      targetType: target.type,
      targetId,
      targetName: target.name,
      reportedBy: req.body.reportedBy || req.user._id,
      reason: req.body.reason,
      evidence: parseList(req.body.evidence),
      status: REPORT_STATUSES.includes(req.body.status) ? req.body.status : 'pending'
    })

    res.status(201).json(normalizeReport(report))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const resolveAdminReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)

    if (!report) {
      return res.status(404).json({ message: 'Report not found' })
    }

    const status = req.body.status || 'resolved'

    if (!['resolved', 'dismissed'].includes(status)) {
      return sendValidationError(res, 'Invalid status')
    }

    report.status = status
    report.resolution = req.body.resolution
    const updated = await report.save()

    res.json(normalizeReport(updated))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const moderateAdminReportTarget = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)

    if (!report) {
      return res.status(404).json({ message: 'Report not found' })
    }

    const target = await findTarget(report.targetType, report.targetId)

    if (!target) {
      report.status = 'resolved'
      report.actionTaken = 'Target already unavailable'
      const updated = await report.save()
      return res.json(normalizeReport(updated))
    }

    if (target.type === 'user' || target.type === 'company') {
      target.item.status = 'suspended'
      await target.item.save()
      report.actionTaken = target.type === 'company' ? 'Compañía suspendida' : 'Usuario suspendido'
    }

    if (target.type === 'job') {
      target.item.status = 'rejected'
      target.item.isActive = false
      await target.item.save()
      report.actionTaken = 'Oferta rechazada'
    }

    if (target.type === 'post') {
      await target.item.deleteOne()
      report.actionTaken = 'Publicación eliminada'
    }

    report.status = 'resolved'
    report.resolution = req.body.resolution || report.actionTaken
    const updated = await report.save()

    res.json(normalizeReport(updated))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteAdminReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)

    if (!report) {
      return res.status(404).json({ message: 'Report not found' })
    }

    await report.deleteOne()

    res.json({ message: 'Report removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAdminCategories = async (req, res) => {
  try {
    const query = {}

    if (req.query.q || req.query.search) {
      query.name = new RegExp(escapeRegex(req.query.q || req.query.search), 'i')
    }

    const categories = await Category.find(query).sort({ name: 1 })
    const talents = await User.find({ role: 'talent' }).select('skills')
    const skillUsage = {}

    talents.forEach(user => {
      const skills = user.skills || []
      skills.forEach(skill => {
        skillUsage[skill] = (skillUsage[skill] || 0) + 1
      })
    })

    res.json({
      data: categories.map(normalizeCategory),
      allSkills: [...new Set(categories.flatMap(category => category.skills || []))],
      skillUsage
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAdminCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    res.json(normalizeCategory(category))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createAdminCategory = async (req, res) => {
  try {
    if (!hasValue(req.body.name)) {
      return sendValidationError(res, 'Name is required')
    }

    const category = await Category.create({
      name: req.body.name,
      description: req.body.description,
      icon: req.body.icon || 'category',
      skills: parseList(req.body.skills)
    })

    res.status(201).json(normalizeCategory(category))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateAdminCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    const allowed = ['name', 'description', 'icon']
    allowed.forEach(field => {
      if (req.body[field] !== undefined) category[field] = req.body[field]
    })

    if (req.body.skills !== undefined) {
      category.skills = parseList(req.body.skills)
    }

    const updated = await category.save()

    res.json(normalizeCategory(updated))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteAdminCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    await category.deleteOne()

    res.json({ message: 'Category removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const addAdminCategorySkill = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    const skill = String(req.body.skill || '').trim()

    if (!skill) {
      return sendValidationError(res, 'Skill is required')
    }

    category.skills = [...new Set([...(category.skills || []), skill])]
    const updated = await category.save()

    res.status(201).json(normalizeCategory(updated))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteAdminCategorySkill = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    const skill = decodeURIComponent(req.params.skill)
    category.skills = (category.skills || []).filter(item => item !== skill)
    const updated = await category.save()

    res.json(normalizeCategory(updated))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
