"use client"
import { redirect } from 'next/navigation'

export default function AdminTeamPage() {
  redirect('/admin/users?tab=entities&type=team')
}
