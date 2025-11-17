using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti_MVC.Data;

[Keyless]
public partial class vw_ProviderAvailability
{
    public int ProviderId { get; set; }

    [StringLength(120)]
    public string BusinessName { get; set; } = null!;

    [StringLength(30)]
    public string? Phone { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MinServicePrice { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MaxServicePrice { get; set; }

    public int TimeSlotId { get; set; }

    public byte DayOfWeek { get; set; }

    [StringLength(9)]
    [Unicode(false)]
    public string? DayName { get; set; }

    [Precision(0)]
    public TimeOnly StartTime { get; set; }

    [Precision(0)]
    public TimeOnly EndTime { get; set; }

    public bool IsActive { get; set; }
}
