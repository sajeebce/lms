import { getCategories } from '../../../categories/actions'
import SingleCourseForm from './single-course-form'

export const metadata = {
  title: 'Create Single Course | LMS',
  description: 'Create a new single course',
}

export default async function CreateSingleCoursePage() {
  const result = await getCategories()
  const categories = result.success ? result.data : []

  return <SingleCourseForm categories={categories} />
}

