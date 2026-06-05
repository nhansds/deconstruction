import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ShellLayout } from './components/ShellLayout'
import { PublicDashboard } from './pages/PublicDashboard'
import { AdminPage } from './pages/AdminPage'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <ShellLayout />,
      children: [
        { index: true, element: <PublicDashboard /> },
        { path: 'admin', element: <AdminPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)

export default function App() {
  return <RouterProvider router={router} />
}
