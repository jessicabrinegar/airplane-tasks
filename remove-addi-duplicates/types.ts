import { UUID } from "crypto";

export type Duplicate = {
    patientid: string;
    duplicate_count: number;
    name: string;
    organization_id: UUID;
    subscriber_ids: UUID[];
}