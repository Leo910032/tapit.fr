// app/dashboard/general components/Preview.jsx - HYDRATION ERROR FIX
"use client"
import Image from 'next/image';
import { useEffect, useState } from 'react';
import "../../styles/3d.css";
import { getSessionCookie } from '@/lib/authentication/session';
import { fetchUserData } from '@/lib/fetch data/fetchUserData';

export default function Preview() {
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState({});
    const [iframeKey, setIframeKey] = useState(0); // Force iframe remount
    const [showIframe, setShowIframe] = useState(false); // Client-side only iframe

    useEffect(() => {
        async function validateAndSetUser() {
            try {
                console.log('🔍 Preview: Starting user validation...');
                
                const sessionUsername = getSessionCookie("adminLinker");
                console.log('🔍 Preview: Session username:', sessionUsername);
                
                if (!sessionUsername) {
                    console.log('❌ Preview: No session username found');
                    setDebugInfo({ error: 'No session username' });
                    setIsLoading(false);
                    return;
                }

                console.log('🔍 Preview: Validating user with fetchUserData...');
                const userId = await fetchUserData(sessionUsername);
                console.log('🔍 Preview: fetchUserData result:', userId);

                if (userId) {
                    console.log('✅ Preview: User validated, setting username:', sessionUsername);
                    setUsername(sessionUsername);
                    setDebugInfo({ 
                        sessionUsername, 
                        userId, 
                        status: 'success' 
                    });
                    
                    // 🔧 Show iframe after successful validation
                    setTimeout(() => {
                        setShowIframe(true);
                    }, 500);
                } else {
                    console.warn(`❌ Preview: User "${sessionUsername}" not found in database`);
                    setDebugInfo({ 
                        error: 'User not found in database',
                        sessionUsername 
                    });
                }
            } catch (error) {
                console.error('❌ Preview: Error during validation:', error);
                setDebugInfo({ 
                    error: error.message,
                    stack: error.stack 
                });
            } finally {
                setIsLoading(false);
            }
        }

        validateAndSetUser();
    }, []);

    // 🔧 Force iframe refresh function
    const refreshIframe = () => {
        setShowIframe(false);
        setIframeKey(prev => prev + 1);
        setTimeout(() => {
            setShowIframe(true);
        }, 100);
    };

    useEffect(() => {
        // 3D tilt logic - only run if container exists
        const container = document.getElementById("preview-container");
        const inner = document.getElementById("preview-inner");

        if (!container || !inner) {
            console.log('🔍 Preview: Container or inner element not found');
            return;
        }

        console.log('✅ Preview: Setting up 3D tilt effects');

        // Mouse tracking logic
        const mouse = {
            _x: 0,
            _y: 0,
            x: 0,
            y: 0,
            updatePosition: function (event) {
                const e = event || window.event;
                this.x = e.clientX - this._x;
                this.y = (e.clientY - this._y) * -1;
            },
            setOrigin: function (e) {
                this._x = e.offsetLeft + Math.floor(e.offsetWidth / 2);
                this._y = e.offsetTop + Math.floor(e.offsetHeight / 2);
            },
            show: function () {
                return "(" + this.x + ", " + this.y + ")";
            },
        };

        mouse.setOrigin(container);

        let counter = 0;
        const updateRate = 10;
        const isTimeToUpdate = function () {
            return counter++ % updateRate === 0;
        };

        const onMouseEnterHandler = function (event) {
            update(event);
        };

        const onMouseLeaveHandler = function () {
            inner.style = "";
        };

        const onMouseMoveHandler = function (event) {
            if (isTimeToUpdate()) {
                update(event);
            }
        };

        const update = function (event) {
            mouse.updatePosition(event);
            updateTransformStyle(
                (mouse.y / inner.offsetHeight / 2).toFixed(2),
                (mouse.x / inner.offsetWidth / 2).toFixed(2)
            );
        };

        const updateTransformStyle = function (x, y) {
            const style = `rotateX(${x}deg) rotateY(${y}deg) scale(0.8)`;
            inner.style.transform = style;
            inner.style.webkitTransform = style;
            inner.style.mozTransform = style;
            inner.style.msTransform = style;
            inner.style.oTransform = style;
        };

        container.onmouseenter = onMouseEnterHandler;
        container.onmouseleave = onMouseLeaveHandler;
        container.onmousemove = onMouseMoveHandler;

        // Cleanup
        return () => {
            if (container) {
                container.onmouseenter = null;
                container.onmouseleave = null;
                container.onmousemove = null;
            }
        };
    }, []);

    // 🔧 Debug component for development
    const DebugPanel = () => {
        if (process.env.NODE_ENV !== 'development') return null;
        
        return (
            <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
                <div className="font-bold mb-1">🔍 Preview Debug:</div>
                <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                <div>Username: {username || 'None'}</div>
                <div>Show iframe: {showIframe ? 'Yes' : 'No'}</div>
                <div>Iframe key: {iframeKey}</div>
                <div>Session: {debugInfo.sessionUsername || 'None'}</div>
                <div>UserID: {debugInfo.userId || 'None'}</div>
                <div>Status: {debugInfo.status || debugInfo.error || 'Unknown'}</div>
                {debugInfo.error && (
                    <div className="text-red-300 mt-1">
                        Error: {debugInfo.error}
                    </div>
                )}
                <button 
                    onClick={refreshIframe}
                    className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                    🔄 Refresh iframe
                </button>
            </div>
        );
    };

    return (
        <div className="w-[35rem] md:grid hidden place-items-center border-l ml-4 relative">
            <DebugPanel />
            
            <div className='w-fit h-fit' id='preview-container'>
                <div className="h-[45rem] scale-[0.8] w-[23rem] bg-black rounded-[3rem] grid place-items-center" id="preview-inner">
                    <div className="h-[97.5%] w-[95%] bg-white bg-opacity-[.1] grid place-items-center rounded-[2.5rem] overflow-hidden relative border">
                        
                        {/* Phone elements */}
                        <div className='absolute h-[20px] w-[20px] rounded-full top-2 bg-black'></div>
                        
                        {/* Loading indicator - show while loading */}
                        {(isLoading || !showIframe) && (
                            <div className='top-6 left-6 absolute pointer-events-none'>
                                <Image 
                                    src={"https://linktree.sirv.com/Images/gif/loading.gif"} 
                                    width={25} 
                                    height={25} 
                                    alt="loading" 
                                    className="mix-blend-screen" 
                                />
                            </div>
                        )}
                        
                        {/* Main content area */}
                        <div className="h-full w-full">
                            {!isLoading && username && showIframe ? (
                                // 🔧 HYDRATION-SAFE IFRAME
                                <iframe 
                                    key={`preview-iframe-${iframeKey}-${username}`} // Unique key to force remount
                                    src={`https://www.tapit.fr/${username}?preview=true&t=${Date.now()}&suppress-hydration-warning=true`}
                                    frameBorder="0" 
                                    className='h-full bg-white w-full'
                                    title={`Preview for ${username}`}
                                    // 🔧 Remove problematic sandbox attributes
                                    sandbox="allow-scripts allow-same-origin allow-forms"
                                    loading="lazy"
                                    onLoad={(e) => {
                                        console.log('✅ Preview iframe loaded successfully');
                                        // 🔧 Try to inject CSS to prevent hydration errors
                                        try {
                                            const iframeDoc = e.target.contentDocument;
                                            if (iframeDoc) {
                                                // Add suppressHydrationWarning to body
                                                iframeDoc.body.setAttribute('suppressHydrationWarning', 'true');
                                            }
                                        } catch (error) {
                                            console.log('Could not access iframe document (CORS):', error.message);
                                        }
                                    }}
                                    onError={(e) => {
                                        console.error('❌ Preview iframe error:', e);
                                        // Auto-retry after error
                                        setTimeout(refreshIframe, 2000);
                                    }}
                                />
                            ) : !isLoading && debugInfo.error ? (
                                // Error state
                                <div className="flex flex-col items-center justify-center h-full text-gray-600 p-4 text-center">
                                    <div className="text-4xl mb-4">⚠️</div>
                                    <div className="text-sm font-medium mb-2">Preview Error</div>
                                    <div className="text-xs text-gray-500 mb-4">
                                        {debugInfo.error}
                                    </div>
                                    <button 
                                        onClick={() => window.location.reload()} 
                                        className="px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                    >
                                        🔄 Retry
                                    </button>
                                </div>
                            ) : !isLoading && !username ? (
                                // No username state
                                <div className="flex flex-col items-center justify-center h-full text-gray-600 p-4 text-center">
                                    <div className="text-4xl mb-4">👤</div>
                                    <div className="text-sm font-medium mb-2">No Preview Available</div>
                                    <div className="text-xs text-gray-500">
                                        Please log in to see your profile preview
                                    </div>
                                </div>
                            ) : (
                                // Loading state
                                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                                    <div className="text-4xl mb-4">⏳</div>
                                    <div className="text-sm">Loading preview...</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}