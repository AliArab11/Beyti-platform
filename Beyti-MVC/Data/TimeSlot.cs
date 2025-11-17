using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti_MVC.Data;

[Table("TimeSlot")]
[Index("ServiceProviderId", Name = "IX_TimeSlot_Provider")]
[Index("ServiceProviderId", "DayOfWeek", "IsActive", Name = "IX_TimeSlot_Provider_Day")]
public partial class TimeSlot
{
    [Key]
    public int Id { get; set; }

    public int ServiceProviderId { get; set; }

    public byte DayOfWeek { get; set; }

    [Precision(0)]
    public TimeOnly StartTime { get; set; }

    [Precision(0)]
    public TimeOnly EndTime { get; set; }

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [InverseProperty("TimeSlot")]
    public virtual ICollection<ServiceBooking> ServiceBookings { get; set; } = new List<ServiceBooking>();

    [ForeignKey("ServiceProviderId")]
    [InverseProperty("TimeSlots")]
    public virtual ServiceProvider ServiceProvider { get; set; } = null!;
}
