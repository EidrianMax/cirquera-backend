import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

import User from './models/User.js'
import Company from './models/Company.js'
import Job from './models/Job.js'
import Post from './models/Post.js'
import Application from './models/Application.js'

dotenv.config()

// 🔐 helper para hash
const hash = async (password) => {
  return await bcrypt.hash(password, 10)
}

const importData = async () => {
  try {
    await User.deleteMany()
    await Company.deleteMany()
    await Job.deleteMany()

    // =========================
    // 👤 USERS (REALISTAS)
    // =========================
    const users = await User.insertMany([
      {
        role: 'admin',
        firstName: 'Albert',
        lastName: 'Martínez',
        username: 'albert-martinez',
        email: 'albert@cirquera.com',
        password: await hash('password'),
        location: 'Barcelona',
        bio: 'Administrador de Cirquera'
      },
      {
        role: 'admin',
        firstName: 'Victor',
        lastName: 'Gómez',
        username: 'victor-gomez',
        email: 'victor@cirquera.com',
        password: await hash('password'),
        location: 'Barcelona'
      },

      // TALENT REALISTA
      {
        role: 'talent',
        firstName: 'Joan',
        lastName: 'Rovira',
        username: 'joan-rovira',
        email: 'joan@circ.cat',
        password: await hash('password'),
        location: 'Barcelona',
        bio: 'Malabarista profesional especializado en bolas y fuego',
        skills: ['Malabares', 'Fuego', 'Clown']
      },
      {
        role: 'talent',
        firstName: 'Maria',
        lastName: 'Sánchez',
        username: 'maria-aerea',
        email: 'maria@aerial.com',
        password: await hash('password'),
        location: 'Valencia',
        bio: 'Artista aérea (telas, aro y trapecio)',
        skills: ['Telas', 'Trapecio', 'Aro']
      },
      {
        role: 'talent',
        firstName: 'Carlos',
        lastName: 'Jiménez',
        username: 'carlos-acro',
        email: 'carlos@acro.com',
        password: await hash('password'),
        location: 'Madrid',
        bio: 'Acróbata de suelo y portés',
        skills: ['Acrobacia', 'Equilibrio']
      },
      {
        role: 'talent',
        firstName: 'Lucía',
        lastName: 'Fernández',
        username: 'lucia-clown',
        email: 'lucia@clown.com',
        password: await hash('password'),
        location: 'Sevilla',
        bio: 'Clown y actriz física',
        skills: ['Clown', 'Teatro físico']
      },
      {
        role: 'talent',
        firstName: 'David',
        lastName: 'López',
        username: 'david-juggler',
        email: 'david@juggle.com',
        password: await hash('password'),
        location: 'Barcelona',
        bio: 'Malabarista técnico con 7 objetos',
        skills: ['Malabares', 'Diábolo']
      },
      {
        role: 'talent',
        firstName: 'Elena',
        lastName: 'Ruiz',
        username: 'elena-danza',
        email: 'elena@dance.com',
        password: await hash('password'),
        location: 'Madrid',
        bio: 'Danza contemporánea aplicada al circo',
        skills: ['Danza', 'Expresión corporal']
      },
      {
        role: 'talent',
        firstName: 'Pablo',
        lastName: 'Ortega',
        username: 'pablo-rigger',
        email: 'pablo@rigging.com',
        password: await hash('password'),
        location: 'Valencia',
        bio: 'Técnico de rigging y estructuras aéreas',
        skills: ['Rigging', 'Seguridad']
      },
      {
        role: 'talent',
        firstName: 'Ana',
        lastName: 'Vidal',
        username: 'ana-hoop',
        email: 'ana@hoop.com',
        password: await hash('password'),
        location: 'Barcelona',
        bio: 'Especialista en aro aéreo',
        skills: ['Aro', 'Flexibilidad']
      }
    ])

    // =========================
    // 🏢 COMPANIES REALISTAS
    // =========================
    const companies = await Company.insertMany([
      {
        name: 'Circ Raluy Legacy',
        username: 'circ-raluy',
        email: 'info@raluy.com',
        password: await hash('password'),
        location: 'Barcelona',
        description: 'Compañía histórica de circo clásico',
        industry: 'Circus',
        website: 'https://raluy.com'
      },
      {
        name: 'Cirque du Soleil España',
        username: 'cirque-du-soleil-es',
        email: 'spain@cirque.com',
        password: await hash('password'),
        location: 'Madrid',
        description: 'Producciones internacionales de circo contemporáneo',
        industry: 'Entertainment'
      },
      {
        name: 'Circ Cric',
        username: 'circ-cric',
        email: 'info@circcric.cat',
        password: await hash('password'),
        location: 'Catalunya',
        description: 'Circo familiar y pedagógico'
      },
      {
        name: 'La Fura dels Baus',
        username: 'fura-dels-baus',
        email: 'info@fura.com',
        password: await hash('password'),
        location: 'Barcelona',
        description: 'Teatro físico y espectáculos de gran formato'
      },
      {
        name: 'NoFit State Circus',
        username: 'nofit-state',
        email: 'contact@nofitstate.org',
        password: await hash('password'),
        location: 'Valencia',
        description: 'Circo contemporáneo experimental'
      },
      {
        name: 'Gran Circo Mundial',
        username: 'gran-circo',
        email: 'info@grancirco.com',
        password: await hash('password'),
        location: 'Madrid'
      },
      {
        name: 'Circo del Sol Producciones',
        username: 'circo-producciones',
        email: 'jobs@circoprod.com',
        password: await hash('password'),
        location: 'Barcelona'
      },
      {
        name: 'Eventos Escénicos SL',
        username: 'eventos-escenicos',
        email: 'contacto@eventos.com',
        password: await hash('password'),
        location: 'Sevilla'
      },
      {
        name: 'Aerial Arts Studio',
        username: 'aerial-arts',
        email: 'info@aerialarts.com',
        password: await hash('password'),
        location: 'Valencia'
      },
      {
        name: 'Clown Factory',
        username: 'clown-factory',
        email: 'hello@clownfactory.com',
        password: await hash('password'),
        location: 'Barcelona'
      }
    ])

    // =========================
    // 💼 JOBS REALISTAS
    // =========================
    const jobs = await Job.insertMany([
      {
        title: 'Malabarista para gira de verano',
        description: 'Buscamos malabarista con experiencia en escenario',
        location: 'Barcelona',
        contractType: 'temporal',
        skillsRequired: ['Malabares'],
        company: companies[0]._id
      },
      {
        title: 'Artista aérea (telas)',
        description: 'Producción internacional requiere artista aérea',
        location: 'Madrid',
        contractType: 'fijo',
        skillsRequired: ['Telas'],
        company: companies[1]._id
      },
      {
        title: 'Clown para espectáculo familiar',
        location: 'Catalunya',
        contractType: 'freelance',
        skillsRequired: ['Clown'],
        company: companies[2]._id
      },
      {
        title: 'Acróbata para show urbano',
        location: 'Barcelona',
        contractType: 'freelance',
        skillsRequired: ['Acrobacia'],
        company: companies[3]._id
      },
      {
        title: 'Artista multidisciplinar',
        location: 'Valencia',
        contractType: 'temporal',
        skillsRequired: ['Danza', 'Circo'],
        company: companies[4]._id
      },
      {
        title: 'Trapecista profesional',
        location: 'Madrid',
        contractType: 'fijo',
        skillsRequired: ['Trapecio'],
        company: companies[5]._id
      },
      {
        title: 'Técnico de rigging',
        location: 'Barcelona',
        contractType: 'freelance',
        skillsRequired: ['Rigging'],
        company: companies[6]._id
      },
      {
        title: 'Animador clown eventos',
        location: 'Sevilla',
        contractType: 'temporal',
        skillsRequired: ['Clown'],
        company: companies[7]._id
      },
      {
        title: 'Instructor de aro aéreo',
        location: 'Valencia',
        contractType: 'fijo',
        skillsRequired: ['Aro'],
        company: companies[8]._id
      },
      {
        title: 'Actor físico / performer',
        location: 'Barcelona',
        contractType: 'freelance',
        skillsRequired: ['Teatro físico'],
        company: companies[9]._id
      }
    ])

    console.log('✅ Datos REALISTAS importados correctamente')
  } catch (error) {
    console.error(error)
  }
}

const destroyData = async () => {
  try {
    await User.deleteMany()
    await Company.deleteMany()
    await Job.deleteMany()
    await Post.deleteMany()
    await Application.deleteMany()
    await Category.deleteMany()
    await Report.deleteMany()

    console.log('🗑️ Datos eliminados correctamente')
  } catch (error) {
    console.error(`❌ Error eliminando datos: ${error.message}`)
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
    console.error(`❌ Error de conexión: ${error.message}`)
    process.exit(1)
  })
