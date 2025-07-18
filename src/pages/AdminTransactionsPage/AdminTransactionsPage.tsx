import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Loader, TransactionCard } from '@/components'
import { useEffect, useState } from 'react'
import { getTransactionAdmin, TransactionData } from '@/api/transactionService'
import {
	PaymentMethod,
	TransactionStatus,
	TransactionType,
} from '@/components/TransactionCard/TransactionCard'

const AdminTransactionsPage = () => {
	const { t } = useTranslation()

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	const [transactions, setTransactions] = useState<TransactionData[]>([])

	useEffect(() => {
		const fetchTransactions = async () => {
			try {
				const data = await getTransactionAdmin()
				setTransactions(data)
			} catch (err) {
				setError(t('error occurred'))
				console.error('Failed to fetch transactions:', err)
			} finally {
				setLoading(false)
			}
		}

		fetchTransactions()
	}, [t])

	if (loading) return <Loader />
	if (error || !transactions)
		return <Typography color='error'>{error}</Typography>
	return (
		<Box>
			<Typography
				sx={{
					ml: '2px',
					fontFamily: 'Manrope',
					fontSize: '14px',
				}}
			>
				<span style={{ opacity: 0.5 }}>{t('admin menu')}</span> |{' '}
				{t('transaction history')}
			</Typography>
			<Typography
				sx={{
					mt: '60px',
					fontFamily: 'Manrope',
					fontSize: '22px',
					fontWeight: 700,
					lineHeight: 1,
					textTransform: 'uppercase',
				}}
			>
				{t('transaction history')}
			</Typography>
			<Box
				sx={{
					mt: '30px',
					display: 'flex',
					flexDirection: 'column',
					gap: '25px',
				}}
			>
				{transactions.map((transaction, index) => (
					<TransactionCard
						key={index}
						id={transaction.transactionId}
						date={transaction.date}
						status={transaction.status as TransactionStatus}
						type={transaction.type as TransactionType}
						paymentMethod={transaction.method as PaymentMethod}
						amount={transaction.amount}
						balance={transaction.balance}
					/>
				))}
			</Box>
		</Box>
	)
}

export default AdminTransactionsPage
