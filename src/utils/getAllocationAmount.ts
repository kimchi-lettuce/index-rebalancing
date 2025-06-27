import z from "zod"
import { cancel, isCancel, text } from "@clack/prompts"

// The user should enter a positive, finite number in millions for the
// allocation amount
const allocationAmountSchema = z
	.string()
	.regex(/^\d+(\.\d+)?$/, "Must be a valid positive number")
	.transform((val) => parseFloat(val))
	.pipe(z.number().positive().finite())

export async function getAllocationAmount() {
	// Choose initial allocation amount
	const allocationAmountInput = await text({
		message: "Enter the initial allocation amount (in millions):",
		placeholder: "100",
		initialValue: "100",
	})

	if (isCancel(allocationAmountInput)) {
		cancel("No allocation amount entered. Exiting.")
		process.exit(0)
	}

	// Validate and parse the allocation amount
	const validationResult = allocationAmountSchema.safeParse(allocationAmountInput)

	if (!validationResult.success) {
		cancel(
			`Invalid allocation amount: ${validationResult.error.errors[0].message}`
		)
		process.exit(1)
	}

	return validationResult.data
}
