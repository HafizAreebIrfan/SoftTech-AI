import { useThemeStore } from "../../../hooks";


export default function AppLoading() {
    const { colors } = useThemeStore();
    return (
        <div className="min-h-screen flex items-center justify-center" style={{background: colors.Background}}>
            <div className="text-center space-y-2">
            <div className="text-lg font-semibold" style={{color: colors.TextHeading}}>Loading App</div>
            </div>
        </div>
    );
}