'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Pencil } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'
import {
	Dialog,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog'

interface HslColor {
	h: number
	s: number
	l: number
}

const PRESETS: { name: string; color: HslColor }[] = [
	{ name: 'Hot Pink', color: { h: 350, s: 99, l: 60 } },
	{ name: 'Sage', color: { h: 95, s: 9, l: 39 } },
	{ name: 'Blue', color: { h: 200, s: 38, l: 48 } },
	{ name: 'Purple', color: { h: 270, s: 60, l: 50 } },
	{ name: 'Orange', color: { h: 25, s: 95, l: 55 } },
	{ name: 'Teal', color: { h: 170, s: 50, l: 40 } },
	{ name: 'Coral', color: { h: 12, s: 76, l: 61 } },
	{ name: 'Indigo', color: { h: 235, s: 55, l: 50 } },
]

function hslString(c: HslColor) {
	return `hsl(${c.h} ${c.s}% ${c.l}%)`
}

function autoForeground(l: number) {
	return l > 55 ? 'hsl(0 0% 9%)' : 'hsl(0 0% 100%)'
}

function hslToHex({ h, s, l }: HslColor): string {
	const sn = s / 100
	const ln = l / 100
	const a = sn * Math.min(ln, 1 - ln)
	const f = (n: number) => {
		const k = (n + h / 30) % 12
		const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, '0')
	}
	return `#${f(0)}${f(8)}${f(4)}`
}

function hexToHsl(hex: string): HslColor {
	const r = parseInt(hex.slice(1, 3), 16) / 255
	const g = parseInt(hex.slice(3, 5), 16) / 255
	const b = parseInt(hex.slice(5, 7), 16) / 255
	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	const l = (max + min) / 2
	if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
	const d = max - min
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
	let h = 0
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
	else if (max === g) h = ((b - r) / d + 2) / 6
	else h = ((r - g) / d + 4) / 6
	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export default function ThemePage() {
	const [primary, setPrimary] = useState<HslColor>({ h: 350, s: 99, l: 60 })
	const [secondary, setSecondary] = useState<HslColor>({ h: 95, s: 9, l: 39 })

	useEffect(() => {
		const root = document.documentElement
		root.style.setProperty('--primary', hslString(primary))
		root.style.setProperty('--primary-foreground', autoForeground(primary.l))
		root.style.setProperty('--ring', hslString(primary))
	}, [primary])

	useEffect(() => {
		const root = document.documentElement
		root.style.setProperty('--secondary', hslString(secondary))
		root.style.setProperty('--secondary-foreground', autoForeground(secondary.l))
	}, [secondary])

	return (
		<MainLayout>
			<div className="mx-auto max-w-5xl space-y-10 pb-16">
				{/* Header */}
				<div>
					<h1 className="text-3xl font-bold text-foreground">Theme Showcase</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Pick your primary and secondary colors. Every component below updates in real time.
					</p>
				</div>

				<Separator />

				{/* Color Palette Pickers */}
				<section className="space-y-6">
					<h2 className="text-xl font-semibold text-foreground">Color Palette</h2>
					<div className="grid gap-8 lg:grid-cols-2">
						<ColorPicker label="Primary" value={primary} onChange={setPrimary} />
						<ColorPicker label="Secondary" value={secondary} onChange={setSecondary} />
					</div>
				</section>

				<Separator />

				{/* Color Token Swatches */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Color Tokens</h2>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<Swatch label="Primary" className="bg-primary" />
						<Swatch label="Secondary" className="bg-secondary" />
						<Swatch label="Destructive" className="bg-destructive" />
						<Swatch label="Muted" className="bg-muted" textClass="text-muted-foreground" />
						<Swatch label="Accent" className="bg-accent" textClass="text-accent-foreground" />
						<Swatch label="Success" className="bg-success" />
						<Swatch label="Warning" className="bg-warning" />
						<Swatch label="Background" className="bg-background border border-border" textClass="text-foreground" />
					</div>
				</section>

				<Separator />

				{/* Buttons */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Buttons</h2>
					<div className="flex flex-wrap items-center gap-3">
						<Button variant="default">Default</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="destructive">Destructive</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="link">Link</Button>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<Button size="sm">Small</Button>
						<Button size="default">Default</Button>
						<Button size="lg">Large</Button>
						<Button disabled>Disabled</Button>
					</div>
				</section>

				<Separator />

				{/* Badges */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Badges</h2>
					<div className="flex flex-wrap items-center gap-3">
						<Badge variant="default">Default</Badge>
						<Badge variant="secondary">Secondary</Badge>
						<Badge variant="destructive">Destructive</Badge>
						<Badge variant="outline">Outline</Badge>
						<Badge variant="success">Success</Badge>
						<Badge variant="warning">Warning</Badge>
					</div>
				</section>

				<Separator />

				{/* Alerts */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Alerts</h2>
					<div className="space-y-3">
						<Alert>
							<AlertTitle>Default Alert</AlertTitle>
							<AlertDescription>This is a default alert using semantic tokens.</AlertDescription>
						</Alert>
						<Alert variant="destructive">
							<AlertTitle>Destructive Alert</AlertTitle>
							<AlertDescription>Something went wrong. Please try again.</AlertDescription>
						</Alert>
						<Alert variant="success">
							<AlertTitle>Success Alert</AlertTitle>
							<AlertDescription>Operation completed successfully.</AlertDescription>
						</Alert>
						<Alert variant="warning">
							<AlertTitle>Warning Alert</AlertTitle>
							<AlertDescription>Please review before proceeding.</AlertDescription>
						</Alert>
					</div>
				</section>

				<Separator />

				{/* Cards */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Cards</h2>
					<div className="flex flex-wrap gap-4">
						<Card
							title="Card Title"
							description="Card description text"
							className="w-full sm:w-[calc(50%-0.5rem)]"
						>
							<p className="text-sm text-muted-foreground">Card body content with semantic tokens.</p>
						</Card>
						<Card
							title="Another Card"
							description="With footer"
							className="w-full sm:w-[calc(50%-0.5rem)]"
							footer={<Button size="sm">Action</Button>}
						>
							<p className="text-sm text-muted-foreground">Cards use bg-card and text-card-foreground.</p>
						</Card>
					</div>
				</section>

				<Separator />

				{/* Form Elements */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Form Elements</h2>
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="demo-input">Input</Label>
							<Input id="demo-input" placeholder="Type something..." />
						</div>
						<div className="space-y-2">
							<Label htmlFor="demo-textarea">Textarea</Label>
							<Textarea id="demo-textarea" placeholder="Write a message..." />
						</div>
						<div className="space-y-3">
							<Label>Checkbox</Label>
							<div className="flex items-center gap-2">
								<Checkbox id="demo-check" defaultChecked />
								<Label htmlFor="demo-check" className="font-normal">Checked item</Label>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox id="demo-check2" />
								<Label htmlFor="demo-check2" className="font-normal">Unchecked item</Label>
							</div>
						</div>
						<div className="space-y-3">
							<Label>Radio Group</Label>
							<RadioGroup defaultValue="option-1">
								<div className="flex items-center gap-2">
									<RadioGroupItem value="option-1" id="r1" />
									<Label htmlFor="r1" className="font-normal">Option One</Label>
								</div>
								<div className="flex items-center gap-2">
									<RadioGroupItem value="option-2" id="r2" />
									<Label htmlFor="r2" className="font-normal">Option Two</Label>
								</div>
							</RadioGroup>
						</div>
						<div className="space-y-2">
							<Label>Select</Label>
							<Select>
								<SelectTrigger>
									<SelectValue placeholder="Choose an option" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="apple">Apple</SelectItem>
									<SelectItem value="banana">Banana</SelectItem>
									<SelectItem value="cherry">Cherry</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-3">
							<Label>Switch</Label>
							<div className="flex items-center gap-2">
								<Switch id="demo-switch" defaultChecked />
								<Label htmlFor="demo-switch" className="font-normal">Enabled</Label>
							</div>
						</div>
					</div>
				</section>

				<Separator />

				{/* Progress & Slider */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Progress & Slider</h2>
					<div className="space-y-6">
						<div className="space-y-2">
							<Label>Progress (65%)</Label>
							<Progress value={65} />
						</div>
						<div className="space-y-2">
							<Label>Slider</Label>
							<Slider defaultValue={[40]} max={100} step={1} />
						</div>
					</div>
				</section>

				<Separator />

				{/* Tabs */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Tabs</h2>
					<Tabs defaultValue="tab1">
						<TabsList>
							<TabsTrigger value="tab1">Account</TabsTrigger>
							<TabsTrigger value="tab2">Security</TabsTrigger>
							<TabsTrigger value="tab3">Billing</TabsTrigger>
						</TabsList>
						<TabsContent value="tab1">
							<Card title="Account Settings" className="mt-2 w-full">
								<p className="text-sm text-muted-foreground">Manage your account preferences here.</p>
							</Card>
						</TabsContent>
						<TabsContent value="tab2">
							<Card title="Security Settings" className="mt-2 w-full">
								<p className="text-sm text-muted-foreground">Update your password and 2FA settings.</p>
							</Card>
						</TabsContent>
						<TabsContent value="tab3">
							<Card title="Billing Info" className="mt-2 w-full">
								<p className="text-sm text-muted-foreground">View and manage billing information.</p>
							</Card>
						</TabsContent>
					</Tabs>
				</section>

				<Separator />

				{/* Avatars */}
				<section className="space-y-6">
					<h2 className="text-xl font-semibold text-foreground">Avatars</h2>

					{/* Example types */}
					<div className="flex items-center gap-6">
						<div className="flex flex-col items-center gap-2">
							<Avatar className="h-12 w-12">
								<AvatarFallback className="bg-background text-foreground border border-border">AB</AvatarFallback>
							</Avatar>
							<span className="text-xs text-muted-foreground">Initials</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<Avatar className="h-12 w-12">
								<AvatarFallback className="bg-primary text-secondary">CD</AvatarFallback>
							</Avatar>
							<span className="text-xs text-muted-foreground">Themed</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<Avatar className="h-12 w-12">
								<AvatarFallback className="bg-muted p-0 text-muted-foreground">
									<SilhouetteSvg variant="neutral" className="h-full w-full" />
								</AvatarFallback>
							</Avatar>
							<span className="text-xs text-muted-foreground">Silhouette</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<Avatar className="h-12 w-12">
								<AvatarImage src="https://i.pravatar.cc/96?img=12" alt="Photo avatar" />
								<AvatarFallback>EF</AvatarFallback>
							</Avatar>
							<span className="text-xs text-muted-foreground">Photo</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<Avatar className="h-12 w-12">
								<AvatarImage src="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" alt="Cartoon avatar" />
								<AvatarFallback>GH</AvatarFallback>
							</Avatar>
							<span className="text-xs text-muted-foreground">Cartoon</span>
						</div>
					</div>

					{/* Interactive avatar editor */}
					<AvatarEditor />
				</section>

				<Separator />

				{/* Tooltip */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Tooltip</h2>
					<Tooltip content="This is a tooltip using semantic tokens">
						<Button variant="outline">Hover me</Button>
					</Tooltip>
				</section>

				<Separator />

				{/* Dialog */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Dialog</h2>
					<Dialog>
						<DialogTrigger asChild>
							<Button>Open Dialog</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Theme Dialog</DialogTitle>
								<DialogDescription>
									This dialog uses semantic overlay, background, and foreground tokens.
								</DialogDescription>
							</DialogHeader>
							<div className="py-4">
								<p className="text-sm text-muted-foreground">
									All components inside the dialog also inherit the current theme.
								</p>
							</div>
							<DialogFooter>
								<Button variant="outline">Cancel</Button>
								<Button>Confirm</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</section>
			</div>
		</MainLayout>
	)
}

/* ------------------------------------------------------------------ */
/*  Color Picker — native <input type="color"> popup                  */
/* ------------------------------------------------------------------ */

function ColorPicker({
	label,
	value,
	onChange,
}: {
	label: string
	value: HslColor
	onChange: (c: HslColor) => void
}) {
	const hex = hslToHex(value)

	return (
		<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
			<div className="mb-4 flex items-center gap-4">
				{/* Clickable swatch — opens native color picker */}
				<label className="relative h-14 w-14 shrink-0 cursor-pointer rounded-lg shadow-inner transition-transform hover:scale-105">
					<div
						className="h-full w-full rounded-lg"
						style={{ backgroundColor: hex }}
					/>
					<input
						type="color"
						value={hex}
						onChange={(e) => onChange(hexToHsl(e.target.value))}
						className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
					/>
				</label>
				<div>
					<h3 className="text-base font-semibold text-foreground">{label}</h3>
					<p className="font-mono text-xs text-muted-foreground">
						{hex} &middot; hsl({value.h}, {value.s}%, {value.l}%)
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">Click swatch to pick a color</p>
				</div>
			</div>

			{/* Preset swatches */}
			<div className="space-y-1.5">
				<Label className="text-xs">Presets</Label>
				<div className="flex flex-wrap gap-2">
					{PRESETS.map((p) => {
						const active =
							p.color.h === value.h && p.color.s === value.s && p.color.l === value.l
						return (
							<Tooltip key={p.name} content={p.name}>
								<button
									type="button"
									onClick={() => onChange(p.color)}
									className={`h-8 w-8 rounded-full shadow-sm transition-transform hover:scale-110 ${active ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`}
									style={{ backgroundColor: hslString(p.color) }}
								/>
							</Tooltip>
						)
					})}
				</div>
			</div>
		</div>
	)
}

/* ------------------------------------------------------------------ */
/*  Avatar Editor — selection dialog                                   */
/* ------------------------------------------------------------------ */

const PHOTO_IDS = [3, 5, 9, 12, 25, 32, 47, 56]
const CARTOON_SEEDS = ['Felix', 'Luna', 'Max', 'Bella', 'Oscar', 'Cleo', 'Milo', 'Nala']

type SilhouetteKind = 'neutral' | 'feminine' | 'masculine'

function SilhouetteSvg({ variant, className }: { variant: SilhouetteKind; className?: string }) {
	return (
		<svg viewBox="0 0 100 100" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
			<circle cx="50" cy="50" r="50" className="fill-muted-foreground/20" />
			{variant === 'neutral' && (
				<>
					<circle cx="50" cy="37" r="15" />
					<path d="M50,55 C33,55 18,66 14,92 L14,100 L86,100 L86,92 C82,66 67,55 50,55Z" />
				</>
			)}
			{variant === 'feminine' && (
				<>
					<ellipse cx="50" cy="36" rx="15" ry="16" />
					<path d="M35,30 C33,42 32,52 35,56 Q37,48 38,34Z" />
					<path d="M65,30 C67,42 68,52 65,56 Q63,48 62,34Z" />
					<path d="M50,56 C33,56 18,66 14,92 L14,100 L86,100 L86,92 C82,66 67,56 50,56Z" />
				</>
			)}
			{variant === 'masculine' && (
				<>
					<circle cx="50" cy="35" r="16" />
					<path d="M34,28 C33,32 34,34 36,33 Q35,30 36,28Z" />
					<path d="M66,28 C67,32 66,34 64,33 Q65,30 64,28Z" />
					<path d="M50,54 C30,54 12,65 8,92 L8,100 L92,100 L92,92 C88,65 70,54 50,54Z" />
				</>
			)}
		</svg>
	)
}

const SILHOUETTE_OPTIONS: { kind: SilhouetteKind; label: string }[] = [
	{ kind: 'neutral', label: 'Neutral' },
	{ kind: 'feminine', label: 'Feminine' },
	{ kind: 'masculine', label: 'Masculine' },
]

type AvatarStyle = 'initials' | 'themed' | 'photo' | 'cartoon' | 'silhouette'

interface AvatarConfig {
	style: AvatarStyle
	initials: string
	photoId: number
	cartoonSeed: string
	silhouetteKind: SilhouetteKind
}

const DEFAULT_CONFIG: AvatarConfig = {
	style: 'silhouette',
	initials: 'AB',
	photoId: 12,
	cartoonSeed: 'Felix',
	silhouetteKind: 'neutral',
}

function AvatarEditor() {
	const [config, setConfig] = useState<AvatarConfig>(DEFAULT_CONFIG)
	const [draft, setDraft] = useState<AvatarConfig>(DEFAULT_CONFIG)
	const [open, setOpen] = useState(false)

	function handleOpen(isOpen: boolean) {
		if (isOpen) setDraft(config)
		setOpen(isOpen)
	}

	function handleSave() {
		setConfig(draft)
		setOpen(false)
	}

	return (
		<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
			<div className="flex items-center gap-4">
				{/* Current avatar — clickable */}
				<Dialog open={open} onOpenChange={handleOpen}>
					<DialogTrigger asChild>
						<button type="button" className="group relative">
							<AvatarDisplay config={config} size="h-16 w-16" />
							<div className="absolute inset-0 flex items-center justify-center rounded-full bg-overlay/0 transition-colors group-hover:bg-overlay/40">
								<Pencil className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
							</div>
						</button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle>Choose Your Avatar</DialogTitle>
							<DialogDescription>
								Pick a style, then select or customize your avatar.
							</DialogDescription>
						</DialogHeader>

						{/* Preview */}
						<div className="flex justify-center py-2">
							<AvatarDisplay config={draft} size="h-20 w-20" />
						</div>

						{/* Tabs for each style */}
						<Tabs
							value={draft.style}
							onValueChange={(v) => setDraft({ ...draft, style: v as AvatarStyle })}
						>
							<TabsList className="w-full">
								<TabsTrigger value="initials" className="flex-1 text-xs">Initials</TabsTrigger>
								<TabsTrigger value="themed" className="flex-1 text-xs">Themed</TabsTrigger>
								<TabsTrigger value="photo" className="flex-1 text-xs">Photo</TabsTrigger>
								<TabsTrigger value="cartoon" className="flex-1 text-xs">Cartoon</TabsTrigger>
								<TabsTrigger value="silhouette" className="flex-1 text-xs">Silhouette</TabsTrigger>
							</TabsList>

							{/* Initials */}
							<TabsContent value="initials" className="space-y-3 pt-2">
								<Label htmlFor="avatar-initials" className="text-xs">Enter initials (1-2 characters)</Label>
								<Input
									id="avatar-initials"
									maxLength={2}
									value={draft.initials}
									onChange={(e) => setDraft({ ...draft, initials: e.target.value.toUpperCase() })}
									placeholder="AB"
									className="w-24"
								/>
							</TabsContent>

							{/* Themed initials */}
							<TabsContent value="themed" className="space-y-3 pt-2">
								<Label htmlFor="avatar-themed-initials" className="text-xs">Enter initials (1-2 characters)</Label>
								<Input
									id="avatar-themed-initials"
									maxLength={2}
									value={draft.initials}
									onChange={(e) => setDraft({ ...draft, initials: e.target.value.toUpperCase() })}
									placeholder="AB"
									className="w-24"
								/>
								<p className="text-xs text-muted-foreground">Uses primary background with secondary text.</p>
							</TabsContent>

							{/* Photos */}
							<TabsContent value="photo" className="pt-2">
								<Label className="text-xs">Select a photo</Label>
								<div className="mt-2 grid grid-cols-4 gap-3">
									{PHOTO_IDS.map((id) => (
										<button
											key={id}
											type="button"
											onClick={() => setDraft({ ...draft, photoId: id })}
											className={`rounded-full transition-transform hover:scale-105 ${draft.photoId === id ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`}
										>
											<Avatar className="h-14 w-14">
												<AvatarImage src={`https://i.pravatar.cc/112?img=${id}`} alt={`Photo ${id}`} />
												<AvatarFallback>...</AvatarFallback>
											</Avatar>
										</button>
									))}
								</div>
							</TabsContent>

							{/* Cartoon */}
							<TabsContent value="cartoon" className="pt-2">
								<Label className="text-xs">Select a character</Label>
								<div className="mt-2 grid grid-cols-4 gap-3">
									{CARTOON_SEEDS.map((seed) => (
										<button
											key={seed}
											type="button"
											onClick={() => setDraft({ ...draft, cartoonSeed: seed })}
											className={`rounded-full transition-transform hover:scale-105 ${draft.cartoonSeed === seed ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`}
										>
											<Avatar className="h-14 w-14">
												<AvatarImage
													src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`}
													alt={seed}
												/>
												<AvatarFallback>...</AvatarFallback>
											</Avatar>
										</button>
									))}
								</div>
							</TabsContent>

							{/* Silhouette */}
							<TabsContent value="silhouette" className="pt-2">
								<Label className="text-xs">Select a silhouette</Label>
								<div className="mt-2 flex gap-3">
									{SILHOUETTE_OPTIONS.map(({ kind, label }) => (
										<button
											key={kind}
											type="button"
											onClick={() => setDraft({ ...draft, silhouetteKind: kind })}
											className={`flex flex-col items-center gap-1.5 rounded-lg p-3 transition-colors hover:bg-accent ${draft.silhouetteKind === kind ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`}
										>
											<Avatar className="h-14 w-14">
												<AvatarFallback className="bg-muted p-0 text-muted-foreground">
													<SilhouetteSvg variant={kind} className="h-full w-full" />
												</AvatarFallback>
											</Avatar>
											<span className="text-xs text-muted-foreground">{label}</span>
										</button>
									))}
								</div>
							</TabsContent>
						</Tabs>

						<DialogFooter className="gap-2 sm:gap-0">
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>
							<Button onClick={handleSave}>Save</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<div>
					<p className="text-sm font-medium text-foreground">Your Avatar</p>
					<p className="text-xs text-muted-foreground">Click to change</p>
				</div>
			</div>
		</div>
	)
}

function AvatarDisplay({ config, size }: { config: AvatarConfig; size: string }) {
	switch (config.style) {
		case 'initials':
			return (
				<Avatar className={size}>
					<AvatarFallback className="bg-background text-foreground border border-border text-lg">
						{config.initials || 'AB'}
					</AvatarFallback>
				</Avatar>
			)
		case 'themed':
			return (
				<Avatar className={size}>
					<AvatarFallback className="bg-primary text-secondary text-lg">
						{config.initials || 'AB'}
					</AvatarFallback>
				</Avatar>
			)
		case 'photo':
			return (
				<Avatar className={size}>
					<AvatarImage src={`https://i.pravatar.cc/160?img=${config.photoId}`} alt="Photo avatar" />
					<AvatarFallback>{config.initials || 'AB'}</AvatarFallback>
				</Avatar>
			)
		case 'cartoon':
			return (
				<Avatar className={size}>
					<AvatarImage
						src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${config.cartoonSeed}`}
						alt="Cartoon avatar"
					/>
					<AvatarFallback>{config.initials || 'AB'}</AvatarFallback>
				</Avatar>
			)
		case 'silhouette':
		default:
			return (
				<Avatar className={size}>
					<AvatarFallback className="bg-muted p-0 text-muted-foreground">
						<SilhouetteSvg variant={config.silhouetteKind} className="h-full w-full" />
					</AvatarFallback>
				</Avatar>
			)
	}
}

/* ------------------------------------------------------------------ */
/*  Swatch helper                                                     */
/* ------------------------------------------------------------------ */

function Swatch({ label, className, textClass = 'text-white' }: { label: string; className: string; textClass?: string }) {
	return (
		<div className={`flex h-20 items-end rounded-lg p-3 ${className}`}>
			<span className={`text-sm font-medium ${textClass}`}>{label}</span>
		</div>
	)
}
