"use client"

import { api } from "@/lib/api-client";
import { Button } from "./button"
import { useRouter } from "next/navigation";

function negate(input: boolean | {error : string} ){
    return !input;
}

export default function UpgradePlusButton({ plus }: { plus: boolean | {error : string} }) {
    const router = useRouter();
    return (
        <Button
            variant="soft"
            size="md"
            className="mt-4 w-full sm:w-auto"
            onClick={async() => {
                await api.plus.$patch(
                    { json : {
                        plus : negate(plus)
                    }}
                ).then(() => router.refresh())
            }}
        >
            {plus ? "Downgrade" : "Upgrade Now"}
        </Button>
    )
}