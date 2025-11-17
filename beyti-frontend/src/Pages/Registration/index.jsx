export default function RegistrationPage() {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
            <div className="max-w-md mx-auto bg-slate-800 rounded-xl shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-4">Registration</h1>
                <p className="text-sm text-slate-400 mb-4">
                    This is a placeholder for the Registration UI. Ali will own this module.
                </p>

                <form className="space-y-4">
                    <input
                        type="text"
                        placeholder="Full name"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="button"
                        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold hover:bg-blue-500"
                    >
                        Create account
                    </button>
                </form>
            </div>
        </div>
    );
}
