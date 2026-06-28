import NewProjectForm from '../../../../components/NewProjectForm'

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Create project</h1>
      <p className="mt-2 text-gray-600">Add a Terraform project for drift monitoring.</p>
      <NewProjectForm />
    </div>
  )
}
