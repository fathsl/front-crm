import type { Category } from "~/help";

export const AddCategoryModal = ({
    category,
    onClose,
    onSubmit,
}: {
    category: Category | null;
    onClose: () => void;
    onSubmit: (category: Category) => void;
}) => {
    return (
        <div>
            <h2>Add Category</h2>
        </div>
    );
};