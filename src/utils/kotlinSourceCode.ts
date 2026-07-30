export const FULL_KOTLIN_COMPOSE_SOURCE = `package com.example.gameresultanalyzer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.room.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch

// ==========================================
// ROOM DATABASE & ENTITY (Local Offline Storage)
// ==========================================

@Entity(tableName = "game_results")
data class GameResultEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val gameType: String, // "coin", "roulette", "wheel", "dice"
    val outcome: String,
    val numericValue: Int? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val sessionId: String = "default_session"
)

@Dao
interface GameResultDao {
    @Query("SELECT * FROM game_results WHERE gameType = :gameType ORDER BY timestamp DESC")
    fun getResultsForGame(gameType: String): Flow<List<GameResultEntity>>

    @Insert
    suspend fun insertResult(result: GameResultEntity)

    @Delete
    suspend fun deleteResult(result: GameResultEntity)

    @Query("DELETE FROM game_results")
    suspend fun clearAll()
}

@Database(entities = [GameResultEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun gameResultDao(): GameResultDao
}

// ==========================================
// STATISTICAL ENGINE & LAPLACE SMOOTHING
// ==========================================

object StatsEngine {
    // Laplace smoothing: Share = (Count + 1) / (Total + K)
    fun calculateLaplaceShare(count: Int, total: Int, kPossibleOutcomes: Int): Double {
        return (count + 1.0) / (total + kPossibleOutcomes)
    }

    // Mini Roulette Rules
    fun isSmall(num: Int) = num in 1..6
    fun isEven(num: Int) = num % 2 == 0
    fun isRed(num: Int) = num in listOf(1, 3, 5, 8, 10, 12)
}

// ==========================================
// JETPACK COMPOSE MATERIAL 3 UI COMPONENTS
// ==========================================

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainAppScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Game Result Analyzer", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                        Text(
                            "Historical tendency — not a guaranteed prediction",
                            fontSize = 11.sp,
                            color = Color(0xFFFFB74D)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1E1E2E)
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF181825)) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    label = { Text("Coin") },
                    icon = { Text("🪙") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    label = { Text("Roulette") },
                    icon = { Text("🎯") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    label = { Text("Wheel") },
                    icon = { Text("🎡") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    label = { Text("Dice") },
                    icon = { Text("🎲") }
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (selectedTab) {
                0 -> CoinComposeScreen()
                1 -> RouletteComposeScreen()
                2 -> WheelComposeScreen()
                3 -> DiceComposeScreen()
            }
        }
    }
}

@Composable
fun CoinComposeScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Coin Flip Outcome Recorder", fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Button(
                onClick = { /* Record Red */ },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935)),
                modifier = Modifier.weight(1f).height(60.dp)
            ) {
                Text("RED", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { /* Record Green */ },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF43A047)),
                modifier = Modifier.weight(1f).height(60.dp)
            ) {
                Text("GREEN", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF2A2A3C))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Statistical Tendency (Laplace Smoothed)", fontWeight = FontWeight.Bold, color = Color.White)
                Text("Pichla trend guaranteed prediction nahi hai.", fontSize = 12.sp, color = Color.Gray)
                Spacer(modifier = Modifier.height(8.dp))
                Text("Highest Historical Tendency: RED (54.3%)")
            }
        }
    }
}

@Composable
fun RouletteComposeScreen() {
    Text("Mini Roulette (Numbers 1 - 12)", modifier = Modifier.padding(16.dp))
}

@Composable
fun WheelComposeScreen() {
    Text("Wheel Outcome Recorder", modifier = Modifier.padding(16.dp))
}

@Composable
fun DiceComposeScreen() {
    Text("Dice Outcome Recorder (Under/Over 50)", modifier = Modifier.padding(16.dp))
}
`;
