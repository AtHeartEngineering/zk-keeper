/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/function-component-definition */
import React, { ReactElement, useEffect, useState } from 'react'
import './popup.scss'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '@src/ui/pages/Home'
import { useRequestsPending, fetchRequestPendingStatus } from '@src/ui/ducks/requests'
import { useDispatch } from 'react-redux'
import { fetchStatus, useAppStatus } from '@src/ui/ducks/app'
import Onboarding from '@src/ui/pages/Onboarding'
import Login from '@src/ui/pages/Login'
import ConfirmRequestModal from '@src/ui/components/ConfirmRequestModal'

export default function Popup(): ReactElement {
    const pendingRequests = useRequestsPending()
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(true)
    const { initialized, unlocked } = useAppStatus()

    useEffect(() => {
        ;(async () => {
            try {
                await dispatch(fetchStatus())
                await dispatch(fetchRequestPendingStatus())
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    useEffect(() => {
        dispatch(fetchRequestPendingStatus())
    }, [unlocked])

    if (loading) {
        return <></>
    }

    let content: any

    if (!initialized) {
        content = <Onboarding />
    } else if (!unlocked) {
        content = <Login />
    } else if (pendingRequests.length) {
        const [pendingRequest] = pendingRequests
        return <ConfirmRequestModal />
    } else {
        content = (
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        )
    }

    return <div className="popup">{content}</div>
}
