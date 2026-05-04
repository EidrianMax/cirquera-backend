import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

import User from './models/User.js'
import Job from './models/Job.js'
import Post from './models/Post.js'
import Application from './models/Application.js'

dotenv.config()

const users = [
  {
    role: 'admin',
    firstName: 'Albert',
    lastName: 'Admin',
    username: 'albert-admin',
    email: 'albert@cirquera.com',
    password: await bcrypt.hash('admin123', 10),
    location: 'Barcelona',
    bio: 'Administrador de la plataforma.'
  },
  {
    role: 'admin',
    firstName: 'Victor',
    lastName: 'Admin',
    username: 'victor-admin',
    email: 'victor@cirquera.com',
    password: await bcrypt.hash('admin123', 10),
    location: 'Barcelona',
    bio: 'Administrador de la plataforma.'
  },
  {
    role: 'talent',
    firstName: 'Joan',
    lastName: 'Artist',
    username: 'joan-artist',
    email: 'joan@example.com',
    password: await bcrypt.hash('password123', 10),
    location: 'Barcelona',
    bio: "Malabarista professional amb 5 anys d'experiència.",
    skills: ['Malabars', 'Equilibrisme', 'Acrobàcia']
  },
  {
    role: 'company',
    firstName: 'Circ',
    lastName: "de l'Est",
    username: 'circ-del-est',
    email: 'est@circ.com',
    password: await bcrypt.hash('password123', 10),
    location: 'Girona',
    bio: 'Companyia de circ contemporani.',
    skills: ['Producció', 'Gestió']
  },
  {
    role: 'talent',
    firstName: 'Maria',
    lastName: 'Aeria',
    username: 'maria-aeria',
    email: 'maria@example.com',
    password: await bcrypt.hash('password123', 10),
    location: 'Valencia',
    bio: 'Especialista en teles aèries i trapezi.',
    skills: ['Teles', 'Trapezi']
  }
]

const importData = async () => {
  try {
    await User.deleteMany()
    await Job.deleteMany()
    await Post.deleteMany()
    await Application.deleteMany()

    const createdUsers = await User.insertMany(users)

    const companyUser = createdUsers[3]._id
    const talentUser1 = createdUsers[2]._id
    const talentUser2 = createdUsers[4]._id

    const sampleJobs = [
      {
        title: "Malabarista per a gala d'estiu",
        description:
          'Busquem un malabarista amb habilitats de clown per a una sèrie de representacions a la costa.',
        location: 'Palamós',
        contractType: 'temporal',
        skillsRequired: ['Malabars', 'Clown'],
        company: companyUser
      },
      {
        title: 'Acrobata aeri',
        description:
          'Es busca acròbata per a espectacle nocturn permanent.',
        location: 'Girona',
        contractType: 'fijo',
        skillsRequired: ['Teles', 'Trapezi'],
        company: companyUser
      }
    ]

    await Job.insertMany(sampleJobs)

    const samplePosts = [
      {
        author: talentUser1,
        content: 'Mireu el meu darrer entrenament amb 7 boles!',
        media: [{ url: 'https://via.placeholder.com/600x400', type: 'image' }]
      },
      {
        author: talentUser2,
        content:
          "Molt contenta de formar part de la convenció de circ d'aquest cap de setmana.",
        media: [{ url: 'https://via.placeholder.com/600x400', type: 'image' }]
      }
    ]

    await Post.insertMany(samplePosts)

    console.log('Dades importades correctament!')
  } catch (error) {
    console.error(`Error a l'importar dades: ${error.message}`)
  }
}

const destroyData = async () => {
  try {
    await User.deleteMany()
    await Job.deleteMany()
    await Post.deleteMany()
    await Application.deleteMany()

    console.log('Dades eliminades!')
  } catch (error) {
    console.error(`Error a l'eliminar dades: ${error.message}`)
  }
}

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/cirquera'

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    if (process.argv[2] === '-d') {
      await destroyData()
    } else {
      await importData()
    }
    mongoose.connection.close()
  })
  .catch((error) => {
    console.error(`Error de connexió: ${error.message}`)
    process.exit(1)
  })
