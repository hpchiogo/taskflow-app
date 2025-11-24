"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { SquarePlus } from 'lucide-react'
import { toast } from 'react-toastify'
import { addUserToProject, getProjectsAssociatedWithUser } from '../actions'
import { useUser } from '@clerk/nextjs'
import { Project } from '@/type'
import ProjectComponent from '../components/ProjectComponent'
import EmptyState from '../components/EmptyState'

const Page = () => {
    const {user} = useUser()
    const email = user?.primaryEmailAddress?.emailAddress as string
    const [inviteCode , setInviteCode] = useState("")
    const [associatedProjects , setAssociatedProjects] = useState<Project[]>([])

    const fetchProjects = async ( email : string) => {
       try {
         const associated = await getProjectsAssociatedWithUser(email)
         setAssociatedProjects(associated)
        } catch (error) {
            toast.error('Erreur lors du chargement des projecs:');
        } 
    }

    useEffect(() => {
      if(email){
          fetchProjects(email)
      }
    } , [email] )
    const handleSubmit = async () => {
        try {
          if(inviteCode != ""){
            await addUserToProject(email , inviteCode)
            fetchProjects(email)
            setInviteCode("")
            toast.success('Vous pouvez maintenant collabore sur ce projet')
          }else{
            toast.error('Il manque le code du projet')
          }
        } catch (error) {
            toast.error('Code invalide ou vous appartenez deja au projet')
        } 
    }
  return (
    <Wrapper>
      <div className='flex'>
        <div className='mb-4'>
             <input 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                type='text'
                placeholder="Code d'invitation"
                className='w-full p-2 input input-bordered'
             />
        </div>
        <button className='btn btn-primary ml-4' onClick={handleSubmit}>
            Rejoindre <SquarePlus className='w-4'/>
        </button>

      </div>

      <div>
        {associatedProjects.length > 0 ? (
            <ul className='w-full grid md:grid-cols-3 gap-7'>
              {associatedProjects.map((project) => (
                <li key={project.id}>
                  <ProjectComponent project={project} admin={0} style={true}></ProjectComponent>
                </li>
              ))}
            </ul>
          ) : (
            <div className='text-gray-500'> 
            <EmptyState
              imageSrc='/empty-project.png'
              imageAlt="Picture of an empty project"
              message='Aucun projet associé'
              />
            </div>
          )}
      </div>
    </Wrapper>
  )
}

export default Page