import Image from "next/image";

export const EmptyFavorites = () => {
    return(
        <div className="h-full flex flex-col items-center justify-center">
            <Image
                src="/empty-favorites.png"
                height={200}
                width={220}
                alt="Empty"
            />
            <h2 className="text-2xl font-semibold mt-6">
                No favorites boards!
            </h2>
            <p className="text-muted-foreground textg-sm mt-2">
                Try adding boards.
            </p>
        </div>
    );
};