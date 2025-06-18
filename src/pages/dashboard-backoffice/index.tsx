import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { TokenPayload } from '@/utils/jwtUtils'

interface Props {
  user: TokenPayload
}

function DashboardBackOffice({ user }: Props) {
  return (
    <MainLayout>
      <section className="py-16 px-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Dashboard do BackOffice</h1>
      </section>
    </MainLayout>
  )
}

export default withBackofficeAuth(DashboardBackOffice)