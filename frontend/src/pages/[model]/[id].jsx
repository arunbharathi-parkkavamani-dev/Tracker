import { useParams } from 'react-router-dom';

const DynamicModelPage = () => {
    const { model, id } = useParams();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Dynamic Model Page</h1>
            <p>Model: {model}</p>
            <p>ID: {id}</p>
            <div className="p-4 bg-yellow-100 text-yellow-800 rounded mt-4 border border-yellow-300">
                <p><strong>Note:</strong> This is a placeholder dynamic route.</p>
                <p>If you are trying to reach "Role Permissions", ensure the route in your database matches the actual file path (e.g., <code>/settings/RoleAccessPolicy</code>).</p>
            </div>
        </div>
    );
};

export default DynamicModelPage;
