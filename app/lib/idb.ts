import { get, set } from 'idb-keyval';
import { Course } from './types';

const COURSES_KEY = 'saved_courses';

export async function getSavedCourses(): Promise<Course[]> {
  const courses = await get<Course[]>(COURSES_KEY);
  return courses || [];
}

export async function saveCourse(course: Course): Promise<void> {
  const courses = await getSavedCourses();
  // Check if course already exists
  const existingIndex = courses.findIndex(c => c.name === course.name);
  if (existingIndex >= 0) {
    courses[existingIndex] = course;
  } else {
    courses.push(course);
  }
  await set(COURSES_KEY, courses);
}

export async function removeCourse(courseId: string): Promise<void> {
  const courses = await getSavedCourses();
  const updated = courses.filter(c => c.id !== courseId);
  await set(COURSES_KEY, updated);
}
