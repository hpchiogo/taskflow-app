import { Project, Task } from '@prisma/client'
import { Copy, ExternalLink, FolderGit2, Trash } from 'lucide-react'
import React, { FC } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'

interface ProjectWithTasks extends Project {
  tasks?: Task[]        // ✔ RENDU OPTIONNEL
  users?: any[]         // ✔ RENDU OPTIONNEL
}

interface projectProps {
  project: ProjectWithTasks
  admin: number
  style: boolean
  onDelete?: (id: string) => void
}

const ProjectComponent: FC<projectProps> = ({ project, admin, style, onDelete }) => {

  // ✔ Fallback pour éviter les erreurs si tasks = undefined
  const tasks = project.tasks ?? [];

  // ✔ Fallback pour users aussi
  const users = project.users ?? [];

  const handleDeleteClick = () => {
    const isConfirmed = window.confirm("Etes-vous sur de vouloir supprimer ce projet ?")
    if (isConfirmed && onDelete) {
      onDelete(project.id)
    }
  }

  const totalTasks = tasks.length

  const tasksByStatus = tasks.reduce(
    (acc, task) => {
      if (task.status === 'To Do') acc.toDo++
      else if (task.status === 'In Progress') acc.inProgress++
      else if (task.status === 'Done') acc.done++
      return acc
    },
    { toDo: 0, inProgress: 0, done: 0 }
  )

  const progressPercentage = totalTasks ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0
  const inProgressPercentage = totalTasks ? Math.round((tasksByStatus.inProgress / totalTasks) * 100) : 0
  const toDoPercentage = totalTasks ? Math.round((tasksByStatus.toDo / totalTasks) * 100) : 0

  const textSizeClass = style ? 'text-sm' : 'text-md'

  const handleCopyCode = async () => {
    try {
      if (project.inviteCode) {
        await navigator.clipboard.writeText(project.inviteCode)
        toast.success("Code d'invitation copié.")
      }
    } catch (error) {
      toast.error("Erreur lors de la copie du code d'invitation.")
    }
  }

  return (
    <div className={`${style ? 'border border-base-300 p-5 shadow-sm ' : ''} text-base-content rounded-xl w-full`}>
      <div className='flex items-center mb-3'>
        <div className='bg-primary-content text-xl h-10 w-10 rounded-lg flex justify-center items-center'>
          <FolderGit2 className='w-6 text-primary' />
        </div>
        <div className='badge ml-3 font-bold'>{project.name}</div>
      </div>

      {!style && (
        <p className='text-sm text-gray-500 border border-base-300 p-5 mb-6 rounded-xl'>
          {project.description}
        </p>
      )}

      <div className='mb-3'>
        <span>Collaborateurs</span>
        <div className='badge badge-sm badge-ghost ml-1'>{users.length}</div>
      </div>

      {admin === 1 && (
        <div className='flex justify-between items-center rounded-lg p-2 border border-base-300 mb-3 bg-base-200/30'>
          <p className='text-primary font-bold ml-3'>{project.inviteCode}</p>
          <button className='btn btn-sm ml-2' onClick={handleCopyCode}>
            <Copy className='w-4' />
          </button>
        </div>
      )}

      {['A faire', 'En cours', 'Terminée(s)'].map((label, idx) => {
        const key = ['toDo', 'inProgress', 'done'][idx] as keyof typeof tasksByStatus
        const percent = [toDoPercentage, inProgressPercentage, progressPercentage][idx]

        return (
          <div key={label} className='flex flex-col mb-3'>
            <h2 className={`text-gray-500 mb-2 ${textSizeClass}`}>
              <span className='font-bold'>{label}</span>
              <div className='badge badge-ghost badge-sm ml-1'>{tasksByStatus[key]}</div>
            </h2>

            <progress className='progress progress-primary w-full' value={percent} max='100'></progress>

            <div className='flex'>
              <span className={`text-gray-400 mt-2 ${textSizeClass}`}>{percent}%</span>
            </div>
          </div>
        )
      })}

      <div className='flex'>
        {style && (
          <Link className='btn btn-primary btn-sm' href={`/project/${project.id}`}>
            <div className='badge badge-sm'>{totalTasks}</div>
            Tâche
            <ExternalLink className='w-4' />
          </Link>
        )}

        {admin === 1 && (
          <button className='btn btn-sm ml-3' onClick={handleDeleteClick}>
            <Trash className='w-4' />
          </button>
        )}
      </div>
    </div>
  )
}

export default ProjectComponent
