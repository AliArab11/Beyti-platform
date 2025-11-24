using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using Beyti_SignalR;
using Beyti_Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<BeytiContext>();
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add SignalR
builder.Services.AddSignalR();

// Add NotificationService
builder.Services.AddScoped<INotificationService, NotificationService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// IMPORTANT: CORS must be called before UseHttpsRedirection and UseAuthorization
app.UseCors("FrontendPolicy");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// Map SignalR Hub
app.MapHub<NotificationHub>("/notificationHub");

app.Run();