'use client'

import { getProjectInfo, getTaskDetails, updateTaskStatus } from '@/app/actions'
import EmptyState from '@/app/components/EmptyState'
import UserInfo from '@/app/components/UserInfo'
import Wrapper from '@/app/components/Wrapper'
import { Project, Task } from '@/type'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import ReactQuill from 'react-quill-new'
import { toast } from 'react-toastify'
import 'react-quill-new/dist/quill.snow.css'
import { useUser } from '@clerk/nextjs'

const Page = ({ params }: { params: Promise<{ taskId: string }> }) => {
  
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress || null

  const [task, setTask] = useState<Task | null>(null)
  const [taskId, setTaskId] = useState<string>('')
  const [project, setProject] = useState<Project | null>(null)

  const [status, setStatus] = useState('')
  const [realStatus, setRealStatus] = useState('')
  const [solution, setSolution] = useState('')

  /** =======================
   * 🛠️ ReactQuill toolbar
   =========================*/
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ font: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'],
    ],
  }

  /** =======================
   * 🔎 Fetch task details
   =========================*/
  const fetchInfos = async (id: string) => {
    try {
      const taskData = await getTaskDetails(id)
      setTask(taskData)

      setStatus(taskData.status)
      setRealStatus(taskData.status)

      fetchProject(taskData.projectId)
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement des détails de la tâche.')
    }
  }

  /** =======================
   * 🔎 Fetch project
   =========================*/
  const fetchProject = async (projectId: string) => {
    try {
      const projectData = await getProjectInfo(projectId, false)
      setProject(projectData)
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement du projet.')
    }
  }

  /** =======================
   * 🧩 Fix Next.js 15 params (Promise)
   =========================*/
  useEffect(() => {
    const unwrapParams = async () => {
      const resolved = await params

      if (resolved?.taskId) {
        setTaskId(resolved.taskId)
        fetchInfos(resolved.taskId)
      }
    }

    unwrapParams()
  }, [params])

  /** =======================
   * 🔄 Changer le status
   =========================*/
  const changeStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateTaskStatus(taskId, newStatus)
      fetchInfos(taskId)
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du changement de status')
    }
  }

  /** =======================
   * 🎛️ Handle status selector
   =========================*/
  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value
    setStatus(newStatus)

    const modal = document.getElementById('my_modal_3') as HTMLDialogElement

    if (!taskId) {
      toast.error('ID de la tâche introuvable')
      return
    }

    changeStatus(taskId, newStatus)
    toast.success('Status changé')

    if (newStatus === 'Done') {
      modal?.showModal()
    } else {
      modal?.close()
    }
  }

  /** =======================
   * ✔️ Clôture de la tâche
   =========================*/
  const closeTask = async (newStatus: string) => {
    const modal = document.getElementById('my_modal_3') as HTMLDialogElement

    try {
      if (solution.trim() === '') {
        toast.error('La solution est obligatoire.')
        return
      }

      await updateTaskStatus(taskId, newStatus, solution)
      fetchInfos(taskId)

      modal?.close()
      toast.success('Tâche clôturée')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la clôture.')
    }
  }

  /** =======================
   * 🪟 Gestion fermeture du modal
   =========================*/
  useEffect(() => {
    const modal = document.getElementById('my_modal_3') as HTMLDialogElement

    const handleClose = () => {
      if (status === 'Done' && status !== realStatus) {
        setStatus(realStatus)
      }
    }

    modal?.addEventListener('close', handleClose)

    return () => {
      modal?.removeEventListener('close', handleClose)
    }
  }, [status, realStatus])

  /** =======================
   * 🖼️ Render UI
   =========================*/
  return (
    <Wrapper>
      {task ? (
        <div>
          {/* Breadcrumbs */}
          <div className="flex flex-col md:justify-between md:flex-row">
            <div className="breadcrumbs text-sm">
              <ul>
                <li>
                  <Link href={`/project/${task.projectId}`}>Retour</Link>
                </li>
                <li>{project?.name}</li>
              </ul>
            </div>

            <div className="p-5 border border-base-300 rounded-xl w-full md:w-fit my-4">
              <UserInfo
                role="Assigné à"
                email={task.user?.email ?? null}
                name={task.user?.name ?? null}
              />
            </div>
          </div>

          {/* Task Title */}
          <h1 className="font-semibold italic text-2xl mb-4">{task.name}</h1>

          {/* Status + Due Date */}
          <div className="flex justify-between items-center mb-4">
            <span>
              A livrer le :
              <div className="badge badge-ghost ml-3">
                {task.dueDate?.toLocaleDateString()}
              </div>
            </span>

            <select
              value={status}
              onChange={handleStatusChange}
              className="select select-sm select-bordered select-primary ml-3"
              disabled={status === 'Done' || task.user?.email !== email}
            >
              <option value="To Do">A faire</option>
              <option value="In Progress">En cours</option>
              <option value="Done">Terminée</option>
            </select>
          </div>

          {/* Creator info */}
          <div className="flex md:justify-between md:items-center flex-col md:flex-row">
            <div className="p-5 border border-base-300 rounded-xl w-full md:w-fit">
              <UserInfo
                role="Créée par"
                email={task.createdBy?.email ?? null}
                name={task.createdBy?.name ?? null}
              />
            </div>

            <div className="badge badge-primary my-5">
              {task.dueDate &&
                `${Math.max(
                  0,
                  Math.ceil(
                    (new Date(task.dueDate).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )} jours restants`}
            </div>
          </div>

          {/* Description */}
          <div className="ql-snow w-full">
            <div
              className="ql-editor p-5 border-base-300 border rounded-xl"
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          </div>

          {/* Solution */}
          {task.solutionDescription && (
            <div>
              <div className="badge badge-primary my-6">Solution</div>
              <div className="ql-snow w-full">
                <div
                  className="ql-editor p-5 border-base-300 border rounded-xl"
                  dangerouslySetInnerHTML={{
                    __html: task.solutionDescription,
                  }}
                />
              </div>
            </div>
          )}

          {/* MODAL */}
          <dialog id="my_modal_3" className="modal">
            <div className="modal-box">
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                  ✕
                </button>
              </form>

              <h3 className="font-bold text-lg">Quelle est la solution ?</h3>
              <p className="py-4">Décrivez ce que vous avez fait exactement.</p>

              <ReactQuill
                placeholder="Décrivez la solution"
                value={solution}
                modules={modules}
                onChange={setSolution}
              />

              <button onClick={() => closeTask(status)} className="btn mt-4">
                Terminé(e)
              </button>
            </div>
          </dialog>
        </div>
      ) : (
        <EmptyState
          imageSrc="/empty-task.png"
          imageAlt="empty task"
          message="Cette tâche n'existe pas"
        />
      )}
    </Wrapper>
  )
}

export default Page
