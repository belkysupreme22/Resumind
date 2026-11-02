import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { Trash2 } from "lucide-react";
import NavBar from "~/components/Navbar";

const WipeApp = () => {
    const { auth, error, fs, kv } = usePuterStore();
    const [files, setFiles] = useState<FSItem[]>([]);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files || []);
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

    return (
        <main className="app-page">
            <NavBar />
            <section className="main-section">
                <div className="page-heading utility-heading">
                    <h1>Manage app data</h1>
                    <h2>Signed in as {auth.user?.username}</h2>
                </div>
                <div className="utility-content">
                    {error ? (
                        <p role="alert" className="notice-panel">{error}</p>
                    ) : (
                        <>
                            <h2>Existing files</h2>
                            <div className="panel utility-file-list">
                                {files.length ? files.map((file) => <p key={file.id}>{file.name}</p>) : <p className="text-muted">No files found.</p>}
                            </div>
                            <button className="primary-button" onClick={() => handleDelete()}>
                                <Trash2 className="size-4" aria-hidden="true" /> Wipe App Data
                            </button>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
};

export default WipeApp;
