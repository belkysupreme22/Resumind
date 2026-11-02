import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { Trash2 } from "lucide-react";

const WipeApp = () => {
    const { auth, error, fs, kv } = usePuterStore();
    const [files, setFiles] = useState<FSItem[]>([]);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files);
    };

    useEffect(() => {
        loadFiles();
    }, []);


    const handleDelete = async () => {
        files.forEach(async (file) => {
            await fs.delete(file.path);
        });
        await kv.flush();
        loadFiles();
    };

    if (error) {
        return <div>Error {error}</div>;
    }

    return (
        <div className="app-page main-section items-start">
            Authenticated as: {auth.user?.username}
            <div>Existing files:</div>
            <div className="panel flex flex-col gap-4 w-full p-6">
                {files.map((file) => (
                    <div key={file.id} className="flex flex-row gap-4">
                        <p>{file.name}</p>
                    </div>
                ))}
            </div>
            <div>
                <button
                    className="primary-button"
                    onClick={() => handleDelete()}
                >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Wipe App Data
                </button>
            </div>
        </div>
    );
};

export default WipeApp;
