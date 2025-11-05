import { getCategories } from '../../../categories/actions'
import { getSubjects } from '@/lib/actions/subject.actions'
import { getClasses } from '@/lib/actions/class.actions'
import { getStreams } from '@/lib/actions/stream.actions'
import SingleCourseForm from './single-course-form'

export const metadata = {
  title: 'Create Single Course | LMS',
  description: 'Create a new single course',
}

export default async function CreateSingleCoursePage() {
  const result = await getCategories()
  const categories = result.success ? result.data : []

  // Fetch academic data
  const subjects = await getSubjects({ status: 'ACTIVE' })
  const classes = await getClasses()
  const streams = await getStreams()

  return (
    <SingleCourseForm
      categories={categories}
      subjects={subjects}
      classes={classes}
      streams={streams}
    />
  )
}

