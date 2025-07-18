import {
	Box,
	TextField,
	Typography,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Client, getProfile, updateProfileField } from '@/api/clientService'
import { Loader } from '@/components'
import { useRandomId } from '@/hooks/useRandomId'
import { createUserTransaction } from '@/api/transactionService'
import { useNavigate } from 'react-router-dom'
import routes from '@/router/routes.json'

const commonTextStyles = {
	fontFamily: 'Manrope',
	lineHeight: 1,
}

const textFieldStyles = {
	'& .MuiInput-root': {
		'&:before': {
			borderBottomColor: '#E0E0E0',
		},
		'&:hover:not(.Mui-disabled):before': {
			borderBottomColor: '#BDBDBD',
		},
	},
	'& .MuiInput-input': {
		fontFamily: 'Manrope',
	},
	'& .Mui-error': {
		'& .MuiInput-root': {
			'&:before': {
				borderBottomColor: '#DE0000',
			},
			'&:after': {
				borderBottomColor: '#DE0000',
			},
			'&:hover:not(.Mui-disabled):before': {
				borderBottomColor: '#DE0000',
			},
		},
	},
}

type Method = 'paypalAddress' | 'wireTransfer' | 'walletBTCAddress'

interface Props {
	method: Method
}

const SecondStep = ({ method }: Props) => {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const [profile, setProfile] = useState<Client>()
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [dialogOpen, setDialogOpen] = useState(false)
	const [dialogText, setDialogText] = useState('')
	const [dialogText2, setDialogText2] = useState('')
	const [dialogText3, setDialogText3] = useState('')
	const [isSuccess, setIsSuccess] = useState<boolean | null>(null)

	const [paypalAddress, setPaypalAddress] = useState('')
	const [walletBTCAddress, setWalletBTCAddress] = useState('')
	const [wireTransferFirstName, setWireTransferFirstName] = useState('')
	const [wireTransferLastName, setWireTransferLastName] = useState('')
	const [wireTransferAccountNumber, setWireTransferAccountNumber] = useState('')
	const [wireTransferRoutingNumber, setWireTransferRoutingNumber] = useState('')
	const [wireTransferBankName, setWireTransferBankName] = useState('')
	const [wireTransferAddress, setWireTransferAddress] = useState('')
	const [amount, setAmount] = useState('')
	const [transactionId, setTransactionId] = useState(useRandomId())
	const [isTermsAccepted, setІsTermsAccepted] = useState(false)

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const data = await getProfile()
				setProfile(data)
				setPaypalAddress(data.paypalAddress)
				setWalletBTCAddress(data.walletBTCAddress)
				setWireTransferFirstName(data.wireTransfer.firstName)
				setWireTransferLastName(data.wireTransfer.lastName)
				setWireTransferAccountNumber(data.wireTransfer.accountNumber)
				setWireTransferRoutingNumber(data.wireTransfer.routingNumber)
				setWireTransferBankName(data.wireTransfer.bankName)
				setWireTransferAddress(data.wireTransfer.address)
			} catch (err) {
				setError(t('error occurred'))
				console.error('Failed to fetch profile:', err)
			} finally {
				setLoading(false)
			}
		}

		fetchProfile()
	}, [])

	const isButtonDisabled = () => {
		if (!amount || Number(amount) <= 0) return true

		if (method === 'paypalAddress' && !paypalAddress) return true
		if (method === 'walletBTCAddress' && !walletBTCAddress) return true
		if (method === 'wireTransfer') {
			if (
				!wireTransferFirstName ||
				!wireTransferLastName ||
				!wireTransferAccountNumber ||
				!wireTransferRoutingNumber ||
				!wireTransferBankName ||
				!wireTransferAddress ||
				!isTermsAccepted
			) {
				return true
			}
		}

		return false
	}

	if (!profile) {
		return <Typography>{t('error occurred')}</Typography>
	}

	const handleCreateTransaction = async () => {
		try {
			if (
				paypalAddress !== profile.paypalAddress ||
				walletBTCAddress !== profile.walletBTCAddress ||
				wireTransferFirstName !== profile.wireTransfer.firstName ||
				wireTransferLastName !== profile.wireTransfer.lastName ||
				wireTransferAccountNumber !== profile.wireTransfer.accountNumber ||
				wireTransferRoutingNumber !== profile.wireTransfer.routingNumber ||
				wireTransferBankName !== profile.wireTransfer.bankName ||
				wireTransferAddress !== profile.wireTransfer.address
			) {
				if (method === 'paypalAddress') {
					await updateProfileField({ paypalAddress: paypalAddress })
				} else if (method === 'walletBTCAddress') {
					await updateProfileField({ walletBTCAddress: walletBTCAddress })
				} else if (method === 'wireTransfer') {
					const updatedWireTransfer = {
						firstName: wireTransferFirstName,
						lastName: wireTransferLastName,
						accountNumber: wireTransferAccountNumber,
						routingNumber: wireTransferRoutingNumber,
						bankName: wireTransferBankName,
						address: wireTransferAddress,
					}

					await updateProfileField({ wireTransfer: updatedWireTransfer })
				}
			}
			const result = await createUserTransaction({
				type: 'withdrawal',
				amount: Number(amount).toFixed(2),
				balance: (Number(profile?.balance) - Number(amount)).toFixed(2),
				method,
				date: new Date(Date.now()).toISOString(),
				status: 'pending',
				transactionId,
			})

			setIsSuccess(true)
			setDialogText(t('ready-steady'))
			setDialogOpen(true)
		} catch (err) {
			console.error(err)
			setIsSuccess(false)
			setDialogText(t('oops'))
			setDialogText2(t('writing to support'))
			setDialogText3(t('we help'))
			setDialogOpen(true)
		}
	}

	const inputs = {
		paypalAddress: [
			{
				name: t('link'),
				key: 'paypalAddress',
				value: paypalAddress,
				onchange: (val: string) => setPaypalAddress(val),
			},
		],
		walletBTCAddress: [
			{
				name: t('BTC adress'),
				key: 'walletBTCAddress',
				value: walletBTCAddress,
				onchange: (val: string) => setWalletBTCAddress(val),
			},
		],
		wireTransfer: [
			{
				name: t('count number'),
				key: 'wireTransferAccountNumber',
				value: wireTransferAccountNumber,
				onchange: (val: string) => setWireTransferAccountNumber(val),
			},
			{
				name: t('route number'),
				key: 'wireTransferRoutingNumber',
				value: wireTransferRoutingNumber,
				onchange: (val: string) => setWireTransferRoutingNumber(val),
			},
			{
				name: t('bank'),
				key: 'wireTransferBankName',
				value: wireTransferBankName,
				onchange: (val: string) => setWireTransferBankName(val),
			},
			{
				name: t('address'),
				key: 'wireTransferAddress',
				value: wireTransferAddress,
				onchange: (val: string) => setWireTransferAddress(val),
			},
			{
				name: t('first name'),
				key: 'wireTransferFirstName',
				value: wireTransferFirstName,
				onchange: (val: string) => setWireTransferFirstName(val),
			},
			{
				name: t('surname'),
				key: 'wireTransferLastName',
				value: wireTransferLastName,
				onchange: (val: string) => setWireTransferLastName(val),
			},
		],
	}

	if (loading) {
		return <Loader />
	}

	if (error) {
		return <Typography color='error'>{error}</Typography>
	}

	return (
		<Box>
			<Typography sx={{ ml: '2px', ...commonTextStyles, fontSize: '14px' }}>
				<span style={{ opacity: 0.5 }}>
					{t('home')} | {t('withdraw')}
				</span>{' '}
				|{' '}
				{method === 'paypalAddress'
					? 'PayPal'
					: method === 'walletBTCAddress'
					? 'Crypto'
					: 'Wire transfer'}
			</Typography>

			<Typography
				sx={{
					mt: '60px',
					...commonTextStyles,
					fontSize: '22px',
					fontWeight: 700,
					textTransform: 'uppercase',
				}}
			>
				{t('step 2 of 2')}
			</Typography>

			<Typography
				sx={{
					mt: '10px',
					...commonTextStyles,
					fontSize: '16px',
					fontWeight: 400,
				}}
			>
				{t('please provide data')}{' '}
				<span>
					{method === 'paypalAddress'
						? 'PayPal'
						: method === 'walletBTCAddress'
						? 'Crypto'
						: 'Wire transfer'}
				</span>
			</Typography>
			<Box
				sx={{
					maxWidth: '500px',
					width: '100%',
					m: '30px auto',
					p: '20px',
					backgroundColor: '#F8F8F8',
					borderRadius: '28px',
					boxSizing: 'border-box',
				}}
			>
				<Box
					sx={{
						mt: '15px',
						mb: '25px',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<Box
						component='img'
						src={
							method === 'paypalAddress'
								? '/bigpaypal.svg'
								: method === 'walletBTCAddress'
								? '/bigwallet.svg'
								: '/bigwire-transfer.svg'
						}
					/>
					<Typography
						sx={{ ...commonTextStyles, fontSize: '22px', fontWeight: 700 }}
					>
						{method === 'walletBTCAddress'
							? 'Crypto'
							: method === 'wireTransfer'
							? 'Wire transfer'
							: ''}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
					{inputs[method]?.map(input =>
						input.key === 'walletBTCAddress' ? (
							<>
								<Typography
									sx={{
										...commonTextStyles,
										fontSize: '14px',
										color: '#6A6A6A',
									}}
								>
									{t('BTC adress')}
								</Typography>
								<Box
									sx={{
										width: '100%',
										mt: '10px',
										mb: '30px',
										p: '5px 10px',
										borderRadius: '8px',
										backgroundColor: '#FFFFFF',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										boxSizing: 'border-box',
									}}
								>
									<TextField
										variant='standard'
										value={walletBTCAddress}
										onChange={e => setWalletBTCAddress(e.target.value)}
										InputProps={{
											disableUnderline: true,
											sx: {
												width: '165px',
												fontSize: '13px',
												fontFamily: 'Manrope',
												padding: 0,
												backgroundColor: 'transparent',
											},
										}}
									/>
									<Button
										onClick={() => {
											if (walletBTCAddress) {
												navigator.clipboard
													.writeText(walletBTCAddress)
													.catch(err => {
														console.error('Failed to copy: ', err)
													})
											}
										}}
										sx={{
											width: '54px',
											height: '24px',
											borderRadius: '6px',
											backgroundColor: '#0549FF',
											color: '#FFFFFF',
											...commonTextStyles,
											fontSize: '14px',
											textTransform: 'none',
										}}
									>
										Copy
									</Button>
								</Box>
							</>
						) : (
							<TextField
								key={input.key}
								variant='standard'
								fullWidth
								placeholder={input.name}
								value={input.value}
								onChange={e => {
									const val = e.target.value
									if (
										input.key === 'wireTransferAccountNumber' ||
										input.key === 'wireTransferRoutingNumber'
									) {
										input.onchange(val.replace(/\D/g, ''))
									} else {
										input.onchange(val)
									}
								}}
								sx={textFieldStyles}
								type={input.key === 'zelleTransferEmail' ? 'email' : 'text'}
							/>
						)
					)}
					<TextField
						variant='standard'
						fullWidth
						placeholder={t('amount')}
						value={amount}
						onChange={e => {
							const val = e.target.value
							let cleaned = val.replace(/[^0-9.]/g, '')
							const parts = cleaned.split('.')
							if (parts.length > 2) {
								cleaned = parts[0] + '.' + parts.slice(1).join('')
							}
							setAmount(cleaned)
						}}
						sx={textFieldStyles}
					/>
					{method === 'wireTransfer' && (
						<Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
							<Checkbox
								checked={isTermsAccepted}
								onChange={() => setІsTermsAccepted(!isTermsAccepted)}
								sx={{ mt: '-9px', ml: '-11px' }}
							/>
							<Typography
								sx={{
									mb: '5px',
									fontSize: '12px',
									fontFamily: 'Manrope',
									color: '#0C0C0C90',
								}}
							>
								{t('aknowledge')}{' '}
								<span
									style={{
										borderBottom: '1px solid #0C0C0C90',
									}}
								>
									{t('agreement')}
								</span>{' '}
								{t('and')}{' '}
								<span
									style={{
										borderBottom: '1px solid #0C0C0C90',
									}}
								>
									{t('statement')}
								</span>
							</Typography>
						</Box>
					)}
				</Box>
				<Button
					variant='contained'
					disabled={isButtonDisabled()}
					sx={{
						mt: '35px',
						px: '50px',
						width: '100%',
						height: '56px',
						border: '1px solid #414141',
						borderRadius: '6px',
						boxShadow: 'none',
						background: 'linear-gradient(90deg, #58A9FF, #0044FF)',
					}}
					onClick={() => handleCreateTransaction()}
				>
					<Box
						sx={{
							width: '100%',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<Typography
							sx={{
								...commonTextStyles,
								fontSize: '20px',
								fontWeight: 700,
								textTransform: 'none',
							}}
						>
							{t('withdraw')}
						</Typography>
						<Box component='img' src='/withdraw.svg' />
					</Box>
				</Button>
				<Box
					sx={{
						mt: '25px',
						display: 'flex',
						gap: '10px',
						alignItems: 'center',
					}}
				>
					<InfoOutlinedIcon />
					<Typography
						sx={{
							fontFamily: 'Manrope',
							fontSize: '14px',
							color: '#414141',
							opacity: 0.5,
						}}
					>
						{t('if you need help')}
					</Typography>
				</Box>
			</Box>
			<Dialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				PaperProps={{
					sx: {
						boxSizing: 'border-box',
						width: '390px',
						minHeight: '263px',
						borderRadius: '24px',
						background: 'linear-gradient(180deg, #58A9FF 0%, #0044FF 50%)',
						color: '#FFFFFF', // чтобы текст был читаемым
						padding: '20px 16px',
					},
				}}
			>
				<DialogContent
					sx={{
						p: '8px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					}}
				>
					{isSuccess === true && (
						<CheckRoundedIcon
							sx={{
								width: '45px',
								height: '45px',
								borderRadius: '10px',
								background: 'linear-gradient(135deg, #0CAA0C, #60E260)',
							}}
						/>
					)}

					{isSuccess === false && (
						<CloseRoundedIcon
							sx={{
								width: '45px',
								height: '45px',
								borderRadius: '10px',
								background: 'linear-gradient(-45deg, #EF3030 0%, #980202 80%)',
							}}
						/>
					)}

					<Typography
						sx={{
							mt: '15px',
							fontFamily: 'Manrope',
							fontSize: '18px',
							color: '#FFFFFF',
							textAlign: 'center',
						}}
					>
						{dialogText}
					</Typography>
					<Typography
						sx={{
							fontFamily: 'Manrope',
							fontSize: '18px',
							fontWeight: 600,
							color: '#FFFFFF',
							textAlign: 'center',
						}}
					>
						{dialogText2}
					</Typography>
					<Typography
						sx={{
							fontFamily: 'Manrope',
							fontSize: '18px',
							color: '#FFFFFF',
							textAlign: 'center',
						}}
					>
						{dialogText3}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={async () => {
							setDialogOpen(false)
							navigate(routes.HomePage.path)
						}}
						sx={{
							width: '100%',
							height: '56px',
							border: '1px solid #232323',
							borderRadius: '6px',
							backgroundColor: '#FFFFFF',
							display: 'inline-block',
						}}
					>
						<Typography
							sx={{
								background: 'linear-gradient(180deg, #58A9FF 0%, #0044FF 50%)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								fontFamily: 'Manrope',
								fontSize: '20px',
								fontWeight: 700,
								textTransform: 'none',
							}}
						>
							{t('return to the main page')}
						</Typography>
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

export default SecondStep
