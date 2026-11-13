import MainWorkspace from '@/features/main/MainWorkspace';
import { mainWorkspaceMock } from '@/features/main/mocks/mainWorkspace.mock';

export default function DevPreview() {
  return <MainWorkspace data={mainWorkspaceMock} />;
}
