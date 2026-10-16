// Prints ALL_TYPE_SLUGS from questionTypeDetail.ts so prerender and verification
// scripts can assert that routes and content definitions remain strictly in sync.
import { ALL_TYPE_SLUGS } from '../src/content/questionTypeDetail'

for (const slug of ALL_TYPE_SLUGS) {
  console.log(slug)
}
