package com.example.pacmantest;
import android.app.Activity;
import android.os.Bundle;
import android.content.Context;
import android.graphics.*;
import android.hardware.*;
import android.speech.tts.TextToSpeech;
import android.view.*;
import java.util.*;

public class MainActivity extends Activity implements SensorEventListener {
 SensorManager sensors; Sensor accel; Game game; TextToSpeech speech;
 float tiltX=0,tiltY=0,zeroX=0,zeroY=0; boolean calibrated=false;
 @Override public void onCreate(Bundle b){super.onCreate(b); sensors=(SensorManager)getSystemService(SENSOR_SERVICE);accel=sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);game=new Game(this);setContentView(game);speech=new TextToSpeech(this,status->{if(status==TextToSpeech.SUCCESS&&speech!=null)speech.setLanguage(new Locale("el","GR"));});}
 @Override protected void onResume(){super.onResume();if(accel!=null)sensors.registerListener(this,accel,SensorManager.SENSOR_DELAY_GAME);}
 @Override protected void onPause(){sensors.unregisterListener(this);super.onPause();}
 @Override protected void onDestroy(){if(speech!=null){speech.stop();speech.shutdown();}super.onDestroy();}
 @Override public void onAccuracyChanged(Sensor s,int a){}
 @Override public void onSensorChanged(SensorEvent e){if(e.sensor.getType()!=Sensor.TYPE_ACCELEROMETER)return;tiltX=.8f*tiltX+.2f*e.values[0];tiltY=.8f*tiltY+.2f*e.values[1];if(!calibrated){zeroX=tiltX;zeroY=tiltY;calibrated=true;}}
 class Game extends View {
  final int W=15,H=19; final int[][] map=new int[H][W]; final boolean[][] pellets=new boolean[H][W]; final Paint p=new Paint(3); final Random rng=new Random(7);
  float px=7,py=15; float heading=0; float[] gx={2,12,7},gy={2,2,9}; int score=0,level=1; long last=0,lastVoice=0; float phase=0;
  Game(Context c){super(c);setLayerType(View.LAYER_TYPE_SOFTWARE,null);reset();}
  void reset(){for(int y=0;y<H;y++)for(int x=0;x<W;x++){boolean wall=x==0||y==0||x==W-1||y==H-1||(x%4==0&&y%5!=2&&y%5!=3&&y>2&&y<H-3)||(y%6==0&&x%5!=2&&x%5!=3&&x>2&&x<W-3);map[y][x]=wall?1:0;pellets[y][x]=!wall;}map[15][7]=0;map[9][7]=0;map[2][2]=0;map[2][12]=0;pellets[15][7]=false;pellets[9][7]=false;pellets[2][2]=false;pellets[2][12]=false;px=7;py=15;heading=0;gx=new float[]{2,12,7};gy=new float[]{2,2,9};boolean[][] seen=new boolean[H][W];ArrayDeque<int[]> q=new ArrayDeque<>();q.add(new int[]{7,15});seen[15][7]=true;while(!q.isEmpty()){int[] t=q.removeFirst();for(int[] d:new int[][]{{1,0},{-1,0},{0,1},{0,-1}}){int nx=t[0]+d[0],ny=t[1]+d[1];if(free(nx,ny)&&!seen[ny][nx]){seen[ny][nx]=true;q.addLast(new int[]{nx,ny});}}}for(int y=0;y<H;y++)for(int x=0;x<W;x++)if(!seen[y][x])pellets[y][x]=false;}
  boolean free(int x,int y){return x>=0&&x<W&&y>=0&&y<H&&map[y][x]==0;}
  void move(float dx,float dy){float nx=px+dx,ny=py+dy;if(free(Math.round(nx),Math.round(py)))px=nx;if(free(Math.round(px),Math.round(ny)))py=ny;}
  void step(float dt){phase+=dt*9;float dx=-(tiltX-zeroX),dy=-(tiltY-zeroY);float dead=.65f;if(Math.abs(dx)<dead)dx=0;if(Math.abs(dy)<dead)dy=0;float mx=Math.max(-1,Math.min(1,dx/4)),my=Math.max(-1,Math.min(1,dy/4));if(Math.abs(mx)>Math.abs(my)&&Math.abs(mx)>.05f)heading=mx>0?0:180;else if(Math.abs(my)>.05f)heading=my>0?90:270;move(mx*dt*3,my*dt*3);
   int ix=Math.round(px),iy=Math.round(py);if(free(ix,iy)&&pellets[iy][ix]){pellets[iy][ix]=false;score+=10;}
   for(int i=0;i<gx.length;i++){float dist=(float)Math.hypot(px-gx[i],py-gy[i]);if(dist<.7f){score+=100;gx[i]=i==0?2:(i==1?12:7);gy[i]=i==2?9:2;if(speech!=null)speech.speak("Ααα! Με έφαγε ο Μήτσος!",TextToSpeech.QUEUE_ADD,null,"eaten"+i);continue;}float best=-999;int bx=0,by=0;for(int[] d:new int[][]{{1,0},{-1,0},{0,1},{0,-1}}){int nx=Math.round(gx[i])+d[0],ny=Math.round(gy[i])+d[1];if(!free(nx,ny))continue;float v=(float)Math.hypot(nx-px,ny-py)+rng.nextFloat()*.8f;if(v>best){best=v;bx=d[0];by=d[1];}}float speed=dt*(.7f+level*.08f);float nextX=gx[i]+bx*speed,nextY=gy[i]+by*speed;if(free(Math.round(nextX),Math.round(nextY))){gx[i]=nextX;gy[i]=nextY;}
    if(dist<4&&System.currentTimeMillis()-lastVoice>9000&&speech!=null){lastVoice=System.currentTimeMillis();speech.speak("Βοήθεια! Έρχεται ο Μήτσος!",TextToSpeech.QUEUE_FLUSH,null,"ghost");}
   }
   boolean any=false;for(int y=0;y<H;y++)for(int x=0;x<W;x++)any|=pellets[y][x];if(!any){level++;reset();}
  }
  @Override protected void onDraw(Canvas c){long now=System.currentTimeMillis();float dt=last==0?0:Math.min(.045f,(now-last)/1000f);last=now;step(dt);super.onDraw(c);c.drawColor(Color.rgb(7,7,19));float cell=Math.min(getWidth()/(float)W,(getHeight()-110f)/H);float ox=(getWidth()-W*cell)/2,oy=90;
   p.setTextSize(32);p.setColor(Color.WHITE);c.drawText("ΜΗΤΣΟΣ  "+score+"   LEVEL "+level,16,46,p);p.setTextSize(17);c.drawText("Πατήστε επάνω για βαθμονόμηση",16,72,p);
   for(int y=0;y<H;y++)for(int x=0;x<W;x++){float cx=ox+(x+.5f)*cell,cy=oy+(y+.5f)*cell;if(map[y][x]==1){p.setColor(Color.rgb(25,75,210));c.drawRoundRect(ox+x*cell+1,oy+y*cell+1,ox+(x+1)*cell-1,oy+(y+1)*cell-1,5,5,p);}else if(pellets[y][x]){p.setColor(Color.rgb(255,218,160));c.drawCircle(cx,cy,cell*.075f,p);}}
   for(int i=0;i<gx.length;i++){float x=ox+(gx[i]+.5f)*cell,y=oy+(gy[i]+.5f)*cell;p.setColor(new int[]{Color.RED,Color.CYAN,Color.MAGENTA}[i]);c.drawCircle(x,y,cell*.37f,p);c.drawRect(x-cell*.37f,y,x+cell*.37f,y+cell*.32f,p);p.setColor(Color.WHITE);c.drawCircle(x-cell*.13f,y-cell*.08f,cell*.10f,p);c.drawCircle(x+cell*.13f,y-cell*.08f,cell*.10f,p);}
   float x=ox+(px+.5f)*cell,y=oy+(py+.5f)*cell;float mouth=(float)(15+30*Math.abs(Math.sin(phase)));p.setColor(Color.YELLOW);c.drawArc(x-cell*.42f,y-cell*.42f,x+cell*.42f,y+cell*.42f,heading+mouth,360-2*mouth,true,p);p.setColor(Color.BLACK);c.drawCircle(x+cell*.04f,y-cell*.19f,cell*.055f,p);
   postInvalidateDelayed(16);
  }
  @Override public boolean onTouchEvent(android.view.MotionEvent e){if(e.getAction()==MotionEvent.ACTION_UP){zeroX=tiltX;zeroY=tiltY;calibrated=true;return true;}return true;}
 }
}