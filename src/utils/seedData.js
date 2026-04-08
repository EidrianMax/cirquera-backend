import User from '../models/User.js'
import Job from '../models/Job.js'
import Post from '../models/Post.js'
import Application from '../models/Application.js'

const seedData = async () => {
  try {
    const userCount = await User.countDocuments()
    if (userCount > 0) {
      console.log('La base de dades ja té dades, saltant el seed.')
      return
    }

    console.log('Iniciant el seed de dades de prova...')

    const users = [
      {
        role: 'talent',
        name: 'Joan Artist',
        email: 'joan@example.com',
        password: 'password123',
        location: 'Barcelona',
        bio: 'Malabarista professional amb 5 anys d\'experiència.',
        skills: ['Malabars', 'Equilibrisme', 'Acrobàcia']
      },
      {
        role: 'company',
        name: 'Circ de l\'Est',
        email: 'est@circ.com',
        password: 'password123',
        location: 'Girona',
        bio: 'Companyia de circ contemporani.',
        skills: ['Producció', 'Gestió']
      },
      {
        role: 'talent',
        name: 'Maria Aèria',
        email: 'maria@example.com',
        password: 'password123',
        location: 'Valencia',
        bio: 'Especialista en teles aèries i trapezi.',
        skills: ['Teles', 'Trapezi']
      }
    ]

    const createdUsers = await User.insertMany(users)

    const companyUser = createdUsers[1]._id
    const talentUser1 = createdUsers[0]._id
    const talentUser2 = createdUsers[2]._id

    const sampleJobs = [
      {
        title: 'Malabarista per a gala d\'estiu',
        description: 'Busquem un malabarista amb habilitats de clown per a una sèrie de representacions a la costa.',
        location: 'Palamós',
        contractType: 'temporal',
        skillsRequired: ['Malabars', 'Clown'],
        company: companyUser
      },
      {
        title: 'Acrobata aeri',
        description: 'Es busca acròbata per a espectacle nocturn permanent.',
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
        content: 'Molt contenta de formar part de la convenció de circ d\'aquest cap de setmana.',
        media: [{ url: 'https://via.placeholder.com/600x400', type: 'image' }]
      }
    ]

    await Post.insertMany(samplePosts)

    console.log('Dades de prova carregades correctament!')
  } catch (error) {
    console.error(`Error al carregar dades de prova: ${error.message}`)
  }
}

export default seedData
