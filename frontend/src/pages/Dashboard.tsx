import MainWorkspace from '@/features/main/MainWorkspace';
import { mainWorkspaceMock } from '@/features/main/mocks/mainWorkspace.mock';

// The route retains authentication; workspace data is mocked until integration.
export default function Dashboard() {
  return <MainWorkspace data={mainWorkspaceMock} />;
}
