"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { AddChildModal } from "@/components/children/AddChildModal";
import { ChildCard } from "@/components/children/ChildCard";
import { Button } from "@/components/ui/Button";
import { useChildren } from "@/hooks/useChildren";

export default function ParentChildrenPage() {
	const { children, loadingChildren, error, addChild } = useChildren(true);
	const [open, setOpen] = useState(false);

	return (
		<>
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-white">My Children</h1>
				<Button className="gap-2" onClick={() => setOpen(true)}>
					<Plus className="h-4 w-4" />
					Add Child
				</Button>
			</div>

			{loadingChildren ? <p className="text-sm text-slate-400">Loading children...</p> : null}
			{error ? <p className="text-sm text-red-400">{error}</p> : null}

			<div className="grid gap-4 lg:grid-cols-2">
				{children.map((child) => (
					<ChildCard key={child.id} child={child} />
				))}
			</div>

			<AddChildModal
				open={open}
				onClose={() => setOpen(false)}
				onSubmit={async (payload) => {
					await addChild(payload);
					toast.success("Child added");
				}}
			/>
		</>
	);
}
