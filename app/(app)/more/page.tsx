import { MoreHeader } from "./MoreHeader";
import { MoreClient } from "./MoreClient";

export default function MorePage() {
  return (
    <>
      <MoreHeader />
      <div className="p-4">
        <MoreClient />
      </div>
    </>
  );
}
