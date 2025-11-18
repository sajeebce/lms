import { redirect } from 'next/navigation'

export default function BoardsLegacyRedirectPage() {
  redirect('/question-bank/institutions')
}

