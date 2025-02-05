import Link from "next/link";

export function FooterNavigation() {
    return (
        <footer className="fixed bottom-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-gray-800 dark:border-gray-600">
            <ul className="flex justify-evenly items-center mt-3 text-sm font-medium text-center text-gray-500 rounded-lg shadow sm:flex-grow dark:divide-gray-700 dark:text-gray-400">
                <li className="w-full">
                    <Link href="/" className="inline-block w-full p-4 bg-white border-0 border-gray-200 dark:border-gray-700 rounded-tr-lg rounded-br-lg hover:text-gray-700 hover:bg-gray-50  dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
                        Edge Agent
                    </Link>          </li>
                <li className="w-full">
                    <Link href="/verification" className="inline-block w-full p-4 bg-white border-0 border-gray-200 dark:border-gray-700 rounded-tr-lg rounded-br-lg hover:text-gray-700 hover:bg-gray-50  dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
                        OOB Verification
                    </Link>          </li>
                <li className="w-full">
                    <Link href="/connections" className="inline-block w-full p-4 bg-white border-0 border-gray-200 dark:border-gray-700 rounded-tr-lg rounded-br-lg hover:text-gray-700 hover:bg-gray-50  dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
                        Connenctions
                    </Link>          </li>
                <li className="w-full">
                    <Link href="/credentials" className="inline-block w-full p-4 bg-white border-0 border-gray-200 dark:border-gray-700 rounded-tr-lg rounded-br-lg hover:text-gray-700 hover:bg-gray-50  dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
                        Credentials
                    </Link>          </li>
                <li className="w-full">
                    <Link href="/messages" className="inline-block w-full p-4 bg-white border-0 border-gray-200 dark:border-gray-700 rounded-tr-lg rounded-br-lg hover:text-gray-700 hover:bg-gray-50  dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
                        Messages
                    </Link>          </li>
                <li className="w-full">
                    <Link href="/debug" className="inline-block w-full p-4 bg-white border-0 border-gray-200 dark:border-gray-700 rounded-tr-lg rounded-br-lg hover:text-gray-700 hover:bg-gray-50  dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
                        Debug
                    </Link>
                </li>
            </ul>
        </footer>
    )
}
