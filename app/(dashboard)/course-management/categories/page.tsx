import { getCategories } from './actions'
import CategoriesClient from './categories-client'

export const metadata = {
  title: 'Course Categories | LMS',
  description: 'Manage course categories',
}

export default async function CategoriesPage() {
  const result = await getCategories()
  const categories = result.success ? result.data : []

  return <CategoriesClient initialCategories={categories} />
}

