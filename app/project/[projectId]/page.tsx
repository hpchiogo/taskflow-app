'use client'

import { deleteTaskById, getProjectInfo } from '@/app/actions'
import Wrapper from '@/app/components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { Project } from '@/type'
import React, { useEffect, useState } from 'react'
import UserInfo from '@/app/components/UserInfo'
import ProjectComponent from '@/app/components/ProjectComponent'
import Link from 'next/link'
import {
  CircleCheckBig,
  CopyPlus,
  ListTodo,
  Loader,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react'
import EmptyState from '@/app/components/EmptyState'
import TaskComponent from '@/app/components/TaskComponent'
import { toast } from 'react-toastify'

const Page = ({ params }: { params: Promise<{ projectId: string }> }) => {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress || ''

  const [projectId, setProjectId] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState(false)

  const [taskCounts, setTaskCounts] = useState({
    todo: 0,
    inProgress: 0,
    done: 0,
    assigned: 0,
  })

  /** =============================
   *  🔎 Fetch project details
   ===============================*/
  const fetchInfos = async (id: string) => {
    try {
      const p = await getProjectInfo(id, true)
      setProject(p)
    } catch (error) {
      console.error('Erreur chargement projet:', error)
    }
  }

  /** =============================
   *  🛠️ Fix Next.js 15 → params = Promise
   ===============================*/
  useEffect(() => {
    const unwrapParams = async () => {
      const resolved = await params

      if (resolved.projectId) {
        setProjectId(resolved.projectId)
        fetchInfos(resolved.projectId)
      }
    }

    unwrapParams()
  }, [params])

  /** =============================
   *  🔢 Count tasks after project loads
   ===============================*/
  useEffect(() => {
    if (project?.tasks && email) {
      setTaskCounts({
        todo: project.tasks.filter((t) => t.status === 'To Do').length,
        inProgress: project.tasks.filter((t) => t.status === 'In Progress').length,
        done: project.tasks.filter((t) => t.status === 'Done').length,
        assigned: project.tasks.filter((t) => t?.user?.email === email).length,
      })
    }
  }, [project, email])

  /** =============================
   *  🔍 Filter tasks by status or assigned
   ===============================*/
  const filteredTasks = project?.tasks?.filter((task) => {
    const statusMatch = !statusFilter || task.status === statusFilter
    const assignedMatch = !assignedFilter || task?.user?.email === email
    return statusMatch && assignedMatch
  })

  /** =============================
   * ❌ Delete Task
   ===============================*/
  const deleteTask = async (taskId: string) => {
    try {
      await deleteTaskById(taskId)
      fetchInfos(projectId)
      toast.success('Tâche supprimée !')
    } catch (error) {
      console.error(error)
      toast.error('Erreur suppression tâche')
    }
  }

  /** =============================
   *  🧩 Sécurité : tasks jamais undefined
   ===============================*/
  const projectWithTasks = project
    ? { ...project, tasks: project.tasks ?? [] }
    : null

  return (
    <Wrapper>
      <div className="md:flex md:flex-row flex-col">
        {/* LEFT SIDEBAR */}
        <div className="md:w-1/4">
          <div className="p-5 border border-base-300 rounded-xl mb-6">
            <UserInfo
              role="Créé par"
              email={project?.createdBy?.email || null}
              name={project?.createdBy?.name || null}
            />
          </div>

          <div className="w-full">
            {projectWithTasks && (
              <ProjectComponent
                project={projectWithTasks}
                admin={0}
                style={false}
              />
            )}
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="mt-6 md:ml-6 md:mt-0 md:w-3/4">
          {/* FILTER BUTTONS */}
          <div className="md:flex md:justify-between">
            <div className="flex flex-col">
              {/* First Row */}
              <div className="space-x-2 mt-2">
                <button
                  onClick={() => {
                    setStatusFilter('')
                    setAssignedFilter(false)
                  }}
                  className={`btn btn-sm ${
                    !statusFilter && !assignedFilter ? 'btn-primary' : ''
                  }`}
                >
                  <SlidersHorizontal className="w-4" /> Tous (
                  {projectWithTasks?.tasks.length || 0})
                </button>

                <button
                  onClick={() => setStatusFilter('To Do')}
                  className={`btn btn-sm ${
                    statusFilter === 'To Do' ? 'btn-primary' : ''
                  }`}
                >
                  <ListTodo className="w-4" /> A faire ({taskCounts.todo})
                </button>

                <button
                  onClick={() => setStatusFilter('In Progress')}
                  className={`btn btn-sm ${
                    statusFilter === 'In Progress' ? 'btn-primary' : ''
                  }`}
                >
                  <Loader className="w-4" /> En cours ({taskCounts.inProgress})
                </button>
              </div>

              {/* Second Row */}
              <div className="space-x-2 mt-2">
                <button
                  onClick={() => setStatusFilter('Done')}
                  className={`btn btn-sm ${
                    statusFilter === 'Done' ? 'btn-primary' : ''
                  }`}
                >
                  <CircleCheckBig className="w-4" /> Finis ({taskCounts.done})
                </button>

                <button
                  onClick={() => setAssignedFilter(!assignedFilter)}
                  className={`btn btn-sm ${
                    assignedFilter ? 'btn-primary' : ''
                  }`}
                >
                  <UserCheck className="w-4" /> Vos tâches (
                  {taskCounts.assigned})
                </button>
              </div>
            </div>

            {/* NEW TASK BUTTON */}
            <Link
              href={`/new-tasks/${projectId}`}
              className="btn btn-sm mt-2 md:mt-0"
            >
              Nouvelle tâche <CopyPlus className="w-4" />
            </Link>
          </div>

          {/* LISTE DES TÂCHES */}
          <div className="mt-6 border border-base-300 p-5 shadow-sm rounded-xl">
            {filteredTasks && filteredTasks.length > 0 ? (
              <div className="overflow-auto">
                <table className="table table-lg">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Titre</th>
                      <th>Assigné à</th>
                      <th className="hidden md:flex">À livrer le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task, index) => (
                      <tr key={task.id}>
                        <TaskComponent
                          task={task}
                          index={index}
                          onDelete={deleteTask}
                          email={email}
                        />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                imageSrc="/empty-task.png"
                imageAlt="empty"
                message="0 tâche à afficher"
              />
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  )
}

export default Page
