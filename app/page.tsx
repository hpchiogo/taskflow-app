'use client'
import { useEffect, useState } from 'react'
import Wrapper from './components/Wrapper'
import { FolderGit2 } from 'lucide-react'
import { createProject, deleteProjectById, getProjectsCreatedByUser } from './actions'
import { useUser } from '@clerk/nextjs'
import { toast } from 'react-toastify'
import { Project, Task } from '@prisma/client'
import ProjectComponent from './components/ProjectComponent'
import EmptyState from './components/EmptyState'


type ProjectWithTasks = Project & {
  tasks: Task[]
  users: any[]
}

export default function Home() {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress as string
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projects, setProjects] = useState<ProjectWithTasks[]>([])

  const fetchProjects = async (email: string) => {
    try {
      const myproject = await getProjectsCreatedByUser(email)
      setProjects(myproject)
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
    }
  }

  useEffect(() => {
    if (email) {
      fetchProjects(email)
    }
  }, [email])

  const deleteProject = async (projectId: string)=> {
    try {
       await deleteProjectById(projectId)
       fetchProjects(email)
       toast.success('Projet supprimé !')
    }catch (error){
      throw new Error('Error deleting project: ' + error);
    }
  }

  const handleSubmit = async () => {
    try {
      const modal = document.getElementById('my_modal_3') as HTMLDialogElement
      await createProject(name, description, email)
      if (modal) modal.close()
      setName("")
      setDescription("")
      fetchProjects(email)
      toast.success("Projet créé avec succès")
      fetchProjects(email)
    } catch (error) {
      console.error('Erreur de création du projet:', error)
    }
  }

  if (!user) return <div className='text-center'>Chargement...</div>

  return (
    <Wrapper>
      <div>
        <button
          className='btn btn-secondary mb-6'
          onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}
        >
          Nouveau Projet <FolderGit2 />
        </button>

        <dialog id='my_modal_3' className='modal'>
          <div className='modal-box'>
            <form method='dialog'>
              <button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'>✕</button>
            </form>
            <h3 className='font-bold text-lg'>Nouveau Projet</h3>
            <input
              placeholder='Nom du projet'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='input input-bordered w-full mb-4'
              required
            />
            <textarea
              placeholder='Description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='textarea textarea-bordered w-full mb-4'
              required
            />
            <button className='btn btn-primary' onClick={handleSubmit}>
              Créer <FolderGit2 />
            </button>
          </div>
        </dialog>

        <div className='w-full'>
          {projects.length > 0 ? (
            <ul className='w-full grid md:grid-cols-3 gap-7'>
              {projects.map((projet) => (
                <li key={projet.id}>
                  <ProjectComponent project={projet} admin={1} style={true} onDelete={deleteProject} />
                </li>
              ))}
            </ul>
          ) : (
            <div className='text-gray-500'> 
            <EmptyState
              imageSrc='/empty-project.png'
              imageAlt="Picture of an empty project"
              message='Aucun projet créer'
              />
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  )
}
